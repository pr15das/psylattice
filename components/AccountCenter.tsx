"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  Database,
  FileText,
  LockKeyhole,
  Mail,
  PencilLine,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";

type Profile = {
  id?: string;
  full_name?: string | null;
  age?: number | null;
  gender?: string | null;
  affiliation_type?: string | null;
  institution_name?: string | null;
  department?: string | null;
  designation?: string | null;
  student_level?: string | null;
  primary_field?: string | null;
  country?: string | null;
  workspace_access?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  profile_completed_at?: string | null;
};

type Entitlements = {
  plan?: string;
  planName?: string;
  planStatus?: string;
  hasPro?: boolean;
  hasAnyStudyPass?: boolean;
  subscription?: {
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
  };
  studies?: {
    maxSimultaneous?: number;
    activeCount?: number;
    remainingActiveSlots?: number;
  };
  participants?: {
    includedPerStudy?: number;
    effectiveLimitForSelectedStudy?: number;
  };
  ai?: {
    allowanceLabel?: string;
    modelAccess?: string;
    remainingPercent?: number | null;
  };
  media?: {
    uploadsAllowed?: boolean;
    includedBytes?: number;
    effectiveStorageBytes?: number;
  };
  participantEmails?: {
    included?: number;
    effectiveAllowance?: number;
  };
};

type Summary = {
  ok?: boolean;
  error?: string;
  account?: {
    id: string;
    email: string;
    emailVerified: boolean;
    createdAt: string | null;
    lastSignInAt: string | null;
  };
  profile?: Profile | null;
  profileCompletionPercent?: number;
  billing?: {
    planLabel: string;
    studyPassCount: number;
    paymentCount: number;
    totalPaidPaise: number;
    lastPaymentAt: string | null;
    entitlements: Entitlements;
  };
};

type Payment = {
  id: string;
  label: string;
  checkoutKind: string;
  status: string;
  amountPaise: number;
  currency: string;
  transactionId: string | null;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  razorpaySubscriptionId: string | null;
  providerState: string | null;
  paidAt: string | null;
  createdAt: string;
};

type PaymentResponse = {
  ok?: boolean;
  error?: string;
  stats?: {
    successfulPayments: number;
    totalPaidPaise: number;
    lastPaymentAt: string | null;
  };
  payments?: Payment[];
  note?: string;
};

type ProfileDraft = {
  full_name: string;
  age: string;
  gender: string;
  affiliation_type: string;
  institution_name: string;
  department: string;
  designation: string;
  student_level: string;
  primary_field: string;
  country: string;
};

const emptyDraft: ProfileDraft = {
  full_name: "",
  age: "",
  gender: "",
  affiliation_type: "",
  institution_name: "",
  department: "",
  designation: "",
  student_level: "",
  primary_field: "",
  country: "",
};

const designationLabels: Record<string, string> = {
  undergraduate_student: "Undergraduate student",
  masters_student: "Master's student",
  phd_scholar: "PhD scholar",
  research_assistant: "Research assistant",
  postdoctoral_researcher: "Postdoctoral researcher",
  lecturer_assistant_professor: "Lecturer / Assistant Professor",
  associate_professor: "Associate Professor",
  professor: "Professor",
  independent_researcher: "Independent researcher",
  industry_researcher: "Industry researcher",
  clinician_practitioner: "Clinician / practitioner",
  other: "Other",
};

const affiliationLabels: Record<string, string> = {
  institution: "Institution affiliated",
  independent: "Independent researcher",
  organisation: "Organisation / company",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(paise: number | null | undefined) {
  const rupees = Math.max(0, Number(paise || 0)) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

function formatBytes(bytes: number | null | undefined) {
  const value = Math.max(0, Number(bytes || 0));
  if (!value) return "0 GB";
  const gb = value / (1024 * 1024 * 1024);
  if (gb >= 1) return `${Math.round(gb * 10) / 10} GB`;
  const mb = value / (1024 * 1024);
  return `${Math.round(mb)} MB`;
}

function profileToDraft(profile: Profile | null | undefined): ProfileDraft {
  return {
    full_name: profile?.full_name || "",
    age: profile?.age ? String(profile.age) : "",
    gender: profile?.gender || "",
    affiliation_type: profile?.affiliation_type || "",
    institution_name: profile?.institution_name || "",
    department: profile?.department || "",
    designation: profile?.designation || "",
    student_level: profile?.student_level || "",
    primary_field: profile?.primary_field || "",
    country: profile?.country || "",
  };
}

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase() || "PL";
}

function paymentTone(status: string) {
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "refunded") return "border-violet-200 bg-violet-50 text-violet-700";
  if (status === "failed") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function SectionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.06),0_2px_8px_rgba(8,145,178,0.035)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs font-semibold text-slate-700">{children}</span>;
}

const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50";

export default function AccountCenter() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [payments, setPayments] = useState<PaymentResponse | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function loadAccount() {
    setLoading(true);
    setError("");
    try {
      const [summaryResponse, paymentResponse] = await Promise.all([
        fetch("/api/account/summary", { cache: "no-store" }),
        fetch("/api/account/payments", { cache: "no-store" }),
      ]);

      const summaryJson = (await summaryResponse.json()) as Summary;
      const paymentJson = (await paymentResponse.json()) as PaymentResponse;

      if (!summaryResponse.ok || !summaryJson.ok) {
        throw new Error(summaryJson.error || "Could not load your account.");
      }
      if (!paymentResponse.ok || !paymentJson.ok) {
        throw new Error(paymentJson.error || "Could not load payment history.");
      }

      setSummary(summaryJson);
      setPayments(paymentJson);
      setDraft(profileToDraft(summaryJson.profile));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load your account.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAccount();
  }, []);

  const name = summary?.profile?.full_name?.trim() || "PsyLattice researcher";
  const email = summary?.account?.email || "";
  const accountInitials = useMemo(() => initials(name, email), [name, email]);
  const entitlements = summary?.billing?.entitlements;
  const planLabel = summary?.billing?.planLabel || "Free";
  const showInstitution =
    draft.affiliation_type === "institution" || draft.affiliation_type === "organisation";
  const showStudentLevel = [
    "undergraduate_student",
    "masters_student",
    "phd_scholar",
  ].includes(draft.designation);

  async function saveProfile() {
    if (saving) return;
    setSaving(true);
    setSaveMessage("");
    setError("");

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        profile?: Profile;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not save your profile.");
      }

      setSaveMessage("Profile saved.");
      await loadAccount();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function sendPasswordReset() {
    if (passwordBusy) return;
    setPasswordBusy(true);
    setPasswordMessage("");
    setError("");

    try {
      const response = await fetch("/api/account/password-reset", {
        method: "POST",
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not send the reset link.");
      }
      setPasswordMessage(result.message || "Password reset link sent.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not send the reset link.");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function deleteAccountPermanently() {
    if (deleteBusy) return;

    if (deleteConfirmation.trim() !== "DELETE") {
      setDeleteError('Type "DELETE" exactly to confirm permanent deletion.');
      return;
    }

    if (!deletePassword) {
      setDeleteError("Enter your current PsyLattice password.");
      return;
    }

    setDeleteBusy(true);
    setDeleteError("");
    setError("");

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: deletePassword,
          confirmation: deleteConfirmation,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "PsyLattice could not delete your account.");
      }

      window.location.assign("/signin?accountDeleted=1");
    } catch (failure) {
      setDeleteError(
        failure instanceof Error
          ? failure.message
          : "PsyLattice could not delete your account.",
      );
      setDeleteBusy(false);
    }
  }

  async function copyAccountId() {
    const id = summary?.account?.id;
    if (!id) return;
    await navigator.clipboard.writeText(id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (loading && !summary) {
    return (
      <main className="min-h-screen bg-[#f2f7f9] p-5 sm:p-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white p-10 text-sm text-slate-500 shadow-sm">
          Loading your PsyLattice account…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.08),_transparent_34%),linear-gradient(180deg,#f7fbfc_0%,#eef5f7_100%)] px-4 py-5 text-slate-950 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 rounded-[30px] border border-slate-200/90 bg-white/95 px-5 py-4 shadow-[0_14px_38px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <PsyLatticeLogo size={38} />
            <div>
              <p className="text-sm font-semibold text-slate-950">Manage account</p>
              <p className="mt-0.5 text-xs text-slate-400">Profile, plan, payments and security</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Workspaces
            </Link>
            <Link
              href="/researcher"
              className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-px"
            >
              Research workspace
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <SectionCard className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[1.35fr_.65fr]">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[26px] border border-cyan-200 bg-gradient-to-br from-white to-cyan-50 text-xl font-bold text-cyan-900 shadow-[0_8px_22px_rgba(8,145,178,0.12)]">
                  {accountInitials}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                      {name}
                    </h1>
                    {summary?.account?.emailVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                        <BadgeCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{email}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-900">
                      {planLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
                      Member since {formatDate(summary?.account?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-gradient-to-br from-slate-950 to-[#0b2a55] p-6 text-white lg:border-l lg:border-t-0 sm:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                Profile completeness
              </p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <p className="text-4xl font-semibold tracking-tight">
                  {summary?.profileCompletionPercent ?? 0}%
                </p>
                <Sparkles className="h-6 w-6 text-cyan-300" />
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-300 transition-all"
                  style={{ width: `${summary?.profileCompletionPercent ?? 0}%` }}
                />
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-300">
                Add your research background so future PsyLattice onboarding and workspace guidance can be more relevant.
              </p>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-5 xl:grid-cols-[1.08fr_.92fr]">
          <SectionCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-700">
                  Personal & research profile
                </p>
                <h2 className="mt-2 text-xl font-semibold">Tell PsyLattice who you are</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Everything except your name is optional. You can leave demographic or institutional information blank at any time.
                </p>
              </div>
              <PencilLine className="h-5 w-5 text-slate-300" />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <FieldLabel>Full name</FieldLabel>
                <input
                  className={inputClass}
                  value={draft.full_name}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, full_name: event.target.value }))
                  }
                  placeholder="Your full name"
                />
              </label>

              <label>
                <FieldLabel>Age · optional</FieldLabel>
                <input
                  className={inputClass}
                  type="number"
                  min={13}
                  max={120}
                  value={draft.age}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, age: event.target.value }))
                  }
                  placeholder="e.g. 24"
                />
              </label>

              <label>
                <FieldLabel>Gender · optional</FieldLabel>
                <select
                  className={inputClass}
                  value={draft.gender}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, gender: event.target.value }))
                  }
                >
                  <option value="">Prefer not to provide</option>
                  <option value="Woman">Woman</option>
                  <option value="Man">Man</option>
                  <option value="Non-binary / gender diverse">Non-binary / gender diverse</option>
                  <option value="Prefer to self-describe">Prefer to self-describe</option>
                  <option value="Prefer not to answer">Prefer not to answer</option>
                </select>
              </label>

              <label>
                <FieldLabel>Research affiliation</FieldLabel>
                <select
                  className={inputClass}
                  value={draft.affiliation_type}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      affiliation_type: event.target.value,
                    }))
                  }
                >
                  <option value="">Choose later</option>
                  {Object.entries(affiliationLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <FieldLabel>Designation / current role</FieldLabel>
                <select
                  className={inputClass}
                  value={draft.designation}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      designation: event.target.value,
                      student_level: [
                        "undergraduate_student",
                        "masters_student",
                        "phd_scholar",
                      ].includes(event.target.value)
                        ? current.student_level
                        : "",
                    }))
                  }
                >
                  <option value="">Choose later</option>
                  {Object.entries(designationLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {showStudentLevel && (
                <label>
                  <FieldLabel>Student level</FieldLabel>
                  <select
                    className={inputClass}
                    value={draft.student_level}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        student_level: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose later</option>
                    <option value="undergraduate">Undergraduate / bachelor's</option>
                    <option value="masters">Master's / postgraduate</option>
                    <option value="doctoral">Doctoral / PhD</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              )}

              {showInstitution && (
                <>
                  <label>
                    <FieldLabel>Institution / organisation</FieldLabel>
                    <input
                      className={inputClass}
                      value={draft.institution_name}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          institution_name: event.target.value,
                        }))
                      }
                      placeholder="University, lab, company…"
                    />
                  </label>
                  <label>
                    <FieldLabel>Department / school</FieldLabel>
                    <input
                      className={inputClass}
                      value={draft.department}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          department: event.target.value,
                        }))
                      }
                      placeholder="Psychology, Neuroscience…"
                    />
                  </label>
                </>
              )}

              <label>
                <FieldLabel>Primary field</FieldLabel>
                <input
                  className={inputClass}
                  value={draft.primary_field}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      primary_field: event.target.value,
                    }))
                  }
                  placeholder="Psychology, Neuroscience, Behavioural Science…"
                />
              </label>

              <label>
                <FieldLabel>Country / region</FieldLabel>
                <input
                  className={inputClass}
                  value={draft.country}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, country: event.target.value }))
                  }
                  placeholder="Country or region"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)] transition hover:-translate-y-px disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save profile"}
              </button>
              {saveMessage && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> {saveMessage}
                </span>
              )}
            </div>
          </SectionCard>

          <div className="space-y-5">
            <SectionCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-700">Plan & usage</p>
                  <h2 className="mt-2 text-xl font-semibold">{planLabel}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Your current research capacity and AI allowance.
                  </p>
                </div>
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3 text-cyan-800">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs font-semibold">Active studies</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold">
                    {entitlements?.studies?.activeCount ?? 0} / {entitlements?.studies?.maxSimultaneous ?? 1}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-semibold">Participants / study</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold">
                    {entitlements?.participants?.includedPerStudy ?? 50}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-semibold">AI budget</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold">
                    {entitlements?.ai?.remainingPercent ?? "—"}% left
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {entitlements?.ai?.allowanceLabel || "Starter"} allowance
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Database className="h-4 w-4" />
                    <span className="text-xs font-semibold">Media storage</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold">
                    {entitlements?.media?.uploadsAllowed
                      ? formatBytes(entitlements?.media?.effectiveStorageBytes)
                      : "Not included"}
                  </p>
                </div>
              </div>

              {summary?.billing?.studyPassCount ? (
                <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-xs text-cyan-900">
                  You currently have {summary.billing.studyPassCount} active Study Pass{summary.billing.studyPassCount === 1 ? "" : "es"}.
                </div>
              ) : null}

              {entitlements?.subscription?.currentPeriodEnd && (
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  Current paid period ends {formatDate(entitlements.subscription.currentPeriodEnd)}
                </div>
              )}

              <Link
                href="/researcher?screen=billing"
                className="mt-5 flex w-full items-center justify-between rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)] transition hover:-translate-y-px"
              >
                <span>Upgrade or manage plan</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </SectionCard>

            <SectionCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-700">Account information</p>
                  <h2 className="mt-2 text-lg font-semibold">Account details</h2>
                </div>
                <UserRound className="h-5 w-5 text-slate-300" />
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {[
                  ["Account created", formatDate(summary?.account?.createdAt)],
                  ["Last sign-in", formatDateTime(summary?.account?.lastSignInAt)],
                  ["Email", email || "—"],
                  ["Workspace access", (summary?.profile?.workspace_access || ["self", "researcher", "clinician"]).map((value) => value[0]?.toUpperCase() + value.slice(1)).join(" · ")],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-5 py-3 first:pt-0 last:pb-0">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className="max-w-[65%] text-right text-xs font-semibold text-slate-700">{value}</span>
                  </div>
                ))}

                <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
                  <div>
                    <p className="text-xs text-slate-400">Account ID</p>
                    <p className="mt-1 max-w-[210px] truncate font-mono text-[10px] text-slate-500">
                      {summary?.account?.id || "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyAccountId()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        <SectionCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-700">Payments</p>
              <h2 className="mt-2 text-xl font-semibold">Payment history</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use a transaction ID when contacting PsyLattice about a billing issue.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[390px]">
              <div className="rounded-2xl bg-slate-50 p-3 text-center">
                <p className="text-[10px] text-slate-400">Payments</p>
                <p className="mt-1 text-lg font-semibold">{payments?.stats?.successfulPayments ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-center">
                <p className="text-[10px] text-slate-400">Total paid</p>
                <p className="mt-1 text-lg font-semibold">{formatMoney(payments?.stats?.totalPaidPaise)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-center">
                <p className="text-[10px] text-slate-400">Last payment</p>
                <p className="mt-1 text-xs font-semibold">{formatDate(payments?.stats?.lastPaymentAt)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Purchase</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Transaction ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {(payments?.payments || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                      No PsyLattice payments yet.
                    </td>
                  </tr>
                ) : (
                  (payments?.payments || []).map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-4 text-slate-500">
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {payment.label}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {formatMoney(payment.amountPaise)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${paymentTone(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {payment.transactionId ? (
                          <code className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-500">
                            {payment.transactionId}
                          </code>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {payments?.note && (
            <p className="mt-3 text-[10px] leading-5 text-slate-400">{payments.note}</p>
          )}
        </SectionCard>

        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-700">Security</p>
                <h2 className="mt-2 text-lg font-semibold">Password & access</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Password changes use the existing verified-email reset flow.
                </p>
              </div>
              <LockKeyhole className="h-5 w-5 text-slate-300" />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800">{email}</p>
                  <p className="mt-1 text-[10px] text-slate-400">Verified account email</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void sendPasswordReset()}
              disabled={passwordBusy}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {passwordBusy ? "Sending…" : "Send password reset link"}
            </button>

            {passwordMessage && (
              <p className="mt-3 text-xs font-semibold text-emerald-700">{passwordMessage}</p>
            )}
          </SectionCard>

          <SectionCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-rose-600">Danger zone</p>
                <h2 className="mt-2 text-lg font-semibold">Delete PsyLattice account</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Permanently remove your PsyLattice login and workspace data. If you have an active Pro subscription, PsyLattice cancels it before the account is deleted.
                </p>
              </div>
              <Trash2 className="h-5 w-5 text-rose-300" />
            </div>

            <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-xs leading-5 text-rose-800">
              Research content and profile data are deleted. A minimal billing/audit archive is retained separately from your account so payment records do not disappear when the auth user is removed.
            </div>

            <button
              type="button"
              onClick={() => {
                setDeleteError("");
                setDeletePassword("");
                setDeleteConfirmation("");
                setDeleteOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete account
            </button>
          </SectionCard>
        </div>

        {deleteOpen && (
          <div
            className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/35 p-4"
            onMouseDown={() => {
              if (!deleteBusy) setDeleteOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              onMouseDown={(event) => event.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-[28px] border border-rose-100 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)]"
            >
              <div className="border-b border-rose-100 bg-gradient-to-br from-white to-rose-50 px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-rose-600">
                        Permanent action
                      </p>
                      <h2 id="delete-account-title" className="mt-1 text-xl font-semibold text-slate-950">
                        Delete your PsyLattice account?
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={deleteBusy}
                    onClick={() => setDeleteOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:text-slate-700 disabled:opacity-50"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                  This removes your PsyLattice login and workspace data and cannot be undone. Any active Pro subscription is cancelled immediately so there are no future renewals.
                </div>

                <label className="block">
                  <FieldLabel>Current password</FieldLabel>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                    disabled={deleteBusy}
                    className={inputClass}
                    placeholder="Enter your password"
                  />
                </label>

                <label className="block">
                  <FieldLabel>Type DELETE to confirm</FieldLabel>
                  <input
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    disabled={deleteBusy}
                    className={inputClass}
                    placeholder="DELETE"
                  />
                </label>

                {deleteError && (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">
                    {deleteError}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={deleteBusy}
                    onClick={() => setDeleteOpen(false)}
                    className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Keep account
                  </button>
                  <button
                    type="button"
                    disabled={
                      deleteBusy ||
                      deleteConfirmation.trim() !== "DELETE" ||
                      !deletePassword
                    }
                    onClick={() => void deleteAccountPermanently()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleteBusy ? "Deleting account…" : "Delete permanently"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="pb-4 text-center text-[11px] text-slate-400">
          PsyLattice account settings apply across Self, Research and Clinical workspaces.
        </footer>
      </div>
    </main>
  );
}
