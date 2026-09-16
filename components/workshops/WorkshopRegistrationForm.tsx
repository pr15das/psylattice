"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeIndianRupee,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  UserRoundCheck,
} from "lucide-react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import {
  formatWorkshopAmount,
  type WorkshopRegistrationContext,
  type WorkshopRegistrationRecord,
} from "@/lib/workshops/registration";

type WorkshopRegistrationFormProps = {
  accountEmail: string;
  accountName: string;
};

type FormState = {
  full_name: string;
  age: string;
  contact_email: string;
  contact_number: string;
  current_city: string;
  state_region: string;
  country: string;
  institution_name: string;
  educational_qualification: string;
  current_programme_course: string;
  year_semester: string;
};

const emptyForm: FormState = {
  full_name: "",
  age: "",
  contact_email: "",
  contact_number: "",
  current_city: "",
  state_region: "",
  country: "India",
  institution_name: "",
  educational_qualification: "",
  current_programme_course: "",
  year_semester: "",
};

function formFromRegistration(
  registration: WorkshopRegistrationRecord | null,
  accountName: string,
  accountEmail: string,
): FormState {
  if (!registration) {
    return {
      ...emptyForm,
      full_name: accountName,
      contact_email: accountEmail,
    };
  }

  return {
    full_name: registration.full_name,
    age: String(registration.age),
    contact_email: registration.contact_email,
    contact_number: registration.contact_number,
    current_city: registration.current_city,
    state_region: registration.state_region,
    country: registration.country,
    institution_name: registration.institution_name,
    educational_qualification: registration.educational_qualification,
    current_programme_course: registration.current_programme_course,
    year_semester: registration.year_semester || "",
  };
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = true,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">
        {label}
        {required ? <span className="ml-1 text-cyan-700">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/60"
      />
      {help ? <span className="mt-1.5 block text-[11px] leading-4 text-slate-400">{help}</span> : null}
    </label>
  );
}

export default function WorkshopRegistrationForm({
  accountEmail,
  accountName,
}: WorkshopRegistrationFormProps) {
  const [context, setContext] = useState<WorkshopRegistrationContext | null>(null);
  const [form, setForm] = useState<FormState>(() =>
    formFromRegistration(null, accountName, accountEmail),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/workshops/registration", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          ok?: boolean;
          error?: string;
          account?: { email?: string; full_name?: string };
          workshop?: WorkshopRegistrationContext["workshop"];
          pricing?: WorkshopRegistrationContext["pricing"];
          registration?: WorkshopRegistrationRecord | null;
        };

        if (!response.ok || !payload.ok || !payload.workshop) {
          throw new Error(payload.error || "Could not load workshop registration.");
        }

        if (cancelled) return;

        const nextContext: WorkshopRegistrationContext = {
          workshop: payload.workshop,
          pricing: payload.pricing || null,
          registration: payload.registration || null,
        };
        setContext(nextContext);
        setForm(
          formFromRegistration(
            nextContext.registration,
            payload.account?.full_name || accountName,
            payload.account?.email || accountEmail,
          ),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load workshop registration.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [accountEmail, accountName]);

  const isConfirmed =
    context?.registration?.status === "paid" ||
    context?.registration?.status === "completed";

  const currentFee = useMemo(() => {
    if (context?.pricing) return formatWorkshopAmount(context.pricing.amount_paise);
    if (context?.registration) {
      return formatWorkshopAmount(context.registration.quoted_amount_paise);
    }
    return null;
  }, [context]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || isConfirmed) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/workshops/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: Number(form.age) }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        registration?: WorkshopRegistrationRecord;
        pricing?: WorkshopRegistrationContext["pricing"];
      };

      if (!response.ok || !payload.ok || !payload.registration) {
        throw new Error(payload.error || "Could not save your workshop registration.");
      }

      setContext((current) =>
        current
          ? {
              ...current,
              pricing: payload.pricing || current.pricing,
              registration: payload.registration || current.registration,
            }
          : current,
      );
      setMessage(
        payload.message ||
          "Your registration details are saved. Your place is confirmed only after verified payment.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save your workshop registration.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f9f8] text-slate-950">
      <header className="px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-slate-200/90 bg-white/95 px-5 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6">
          <PsyLatticeLogo />
          <Link
            href="/workshops"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Workshop page
          </Link>
        </div>
      </header>

      <section className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-7 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
            <aside className="space-y-4 lg:sticky lg:top-6">
              <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,.13)] sm:p-7">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-300">
                  November 2026 cohort
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em]">
                  Foundations of Modern Psychological Research with PsyLattice
                </h1>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  Register with the PsyLattice account you already use, or with the new account you just created. One account is all you need.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3 rounded-2xl bg-white/[.06] p-4">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">Possible start date</p>
                      <p className="mt-1 text-sm font-semibold">7 November 2026</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-white/[.06] p-4">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">Format</p>
                      <p className="mt-1 text-sm font-semibold">One live hour each weekend for one month</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-white/[.06] p-4">
                    <BadgeIndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">Current fee</p>
                      <p className="mt-1 text-2xl font-semibold">{currentFee || "—"}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        The payable fee is determined again when payment is created, so the date of successful payment controls the final price.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-cyan-100 bg-cyan-50/60 p-5">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-cyan-800" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Your registration is tied to this account</p>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Payment status, Workshop Reference, certificate status and private participant access will all be connected to the same PsyLattice account.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_22px_65px_rgba(15,23,42,.07)] sm:p-8">
              {loading ? (
                <div className="flex min-h-[460px] items-center justify-center">
                  <div className="text-center">
                    <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-cyan-700" />
                    <p className="mt-3 text-sm text-slate-500">Loading workshop registration…</p>
                  </div>
                </div>
              ) : error && !context ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-700">
                  {error}
                </div>
              ) : isConfirmed && context?.registration ? (
                <div className="py-8 text-center sm:py-14">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-7 w-7" />
                  </span>
                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[.15em] text-emerald-700">Registration confirmed</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">You are registered for the workshop.</h2>
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600">
                    Your payment has been verified. Private participant access and certificate status will remain connected to this PsyLattice account.
                  </p>
                  {context.registration.workshop_reference ? (
                    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-slate-200 bg-[#f8fbfb] p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Workshop Reference</p>
                      <p className="mt-2 font-mono text-xl font-semibold text-slate-950">
                        {context.registration.workshop_reference}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-cyan-800">Workshop registration</p>
                      <h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">Tell us who is joining.</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        These details are used for cohort administration, participant communication and your certificate record.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50/60 px-3 py-2 text-xs font-semibold text-cyan-900">
                      <UserRoundCheck className="h-4 w-4" />
                      Signed in as {accountEmail}
                    </div>
                  </div>

                  {!context?.pricing ? (
                    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
                      Registration is currently closed. If you already paid for this workshop, your verified registration will appear here once payment is linked to your account.
                    </div>
                  ) : null}

                  <form onSubmit={submit} className="mt-7">
                    <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                      <Field label="Full name for the certificate" value={form.full_name} onChange={(value) => updateField("full_name", value)} placeholder="Your full name" />
                      <Field label="Age" type="number" value={form.age} onChange={(value) => updateField("age", value)} placeholder="Age" />
                      <Field label="Email ID" type="email" value={form.contact_email} onChange={(value) => updateField("contact_email", value)} placeholder="you@example.com" />
                      <Field label="Contact number" type="tel" value={form.contact_number} onChange={(value) => updateField("contact_number", value)} placeholder="Include country code if applicable" />
                      <Field label="Current city / town" value={form.current_city} onChange={(value) => updateField("current_city", value)} placeholder="City or town" />
                      <Field label="State / region" value={form.state_region} onChange={(value) => updateField("state_region", value)} placeholder="State or region" />
                      <Field label="Country" value={form.country} onChange={(value) => updateField("country", value)} placeholder="Country" />
                      <Field
                        label="Current institution / organization"
                        value={form.institution_name}
                        onChange={(value) => updateField("institution_name", value)}
                        placeholder="Institution, organization, or Independent"
                        help="If you are not currently affiliated, enter Independent."
                      />
                      <Field label="Educational qualification" value={form.educational_qualification} onChange={(value) => updateField("educational_qualification", value)} placeholder="e.g. BA Psychology, MSc Psychology" />
                      <Field
                        label="Current programme / course"
                        value={form.current_programme_course}
                        onChange={(value) => updateField("current_programme_course", value)}
                        placeholder="e.g. MSc Psychology or Not currently enrolled"
                      />
                      <Field
                        label="Year / semester"
                        value={form.year_semester}
                        onChange={(value) => updateField("year_semester", value)}
                        placeholder="Optional"
                        required={false}
                      />
                    </div>

                    {error ? (
                      <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">{error}</div>
                    ) : null}
                    {message ? (
                      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">{message}</div>
                    ) : null}

                    <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <p className="max-w-xl text-xs leading-5 text-slate-500">
                        Saving this form does not confirm your place. Payment must be successfully verified first. Your Workshop Reference is created only after verified payment.
                      </p>
                      <button
                        type="submit"
                        disabled={saving || !context?.pricing}
                        className="inline-flex min-w-48 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-cyan-950 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                        {saving ? "Saving…" : context?.registration ? "Update registration" : "Save registration details"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
