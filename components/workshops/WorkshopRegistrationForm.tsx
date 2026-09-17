"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  BadgeIndianRupee,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  ExternalLink,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import {
  formatWorkshopAmount,
  type WorkshopPrivateAccess,
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

type RegistrationApiPayload = {
  ok?: boolean;
  error?: string;
  message?: string;
  account?: { email?: string; full_name?: string };
  workshop?: WorkshopRegistrationContext["workshop"];
  pricing?: WorkshopRegistrationContext["pricing"];
  registration?: WorkshopRegistrationRecord | null;
  private_access?: WorkshopPrivateAccess | null;
};

type PaymentCreatePayload = {
  ok?: boolean;
  error?: string;
  alreadyPaid?: boolean;
  registrationId?: string;
  keyId?: string;
  orderId?: string;
  amountPaise?: number;
  currency?: string;
  description?: string;
  pricingLabel?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  workshopReference?: string | null;
  paymentId?: string | null;
};

type PaymentVerifyPayload = {
  ok?: boolean;
  error?: string;
  paid?: boolean;
  processing?: boolean;
  message?: string;
  registration?: WorkshopRegistrationRecord;
  private_access?: WorkshopPrivateAccess | null;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
};

type RazorpayInstance = { open: () => void };
type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

function getRazorpayConstructor(): RazorpayConstructor | undefined {
  return (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
}


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

function loadRazorpayCheckout() {
  return new Promise<boolean>((resolve) => {
    if (getRazorpayConstructor()) {
      resolve(true);
      return;
    }

    const src = "https://checkout.razorpay.com/v1/checkout.js";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(getRazorpayConstructor())), {
        once: true,
      });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.psylatticeRazorpay = "true";
    script.onload = () => resolve(Boolean(getRazorpayConstructor()));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  help,
  required = true,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  help?: string;
  required?: boolean;
  autoComplete?: string;
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
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/60"
      />
      {help ? (
        <span className="mt-1.5 block text-[11px] leading-4 text-slate-400">
          {help}
        </span>
      ) : null}
    </label>
  );
}

function StatusNotice({
  tone,
  children,
}: {
  tone: "success" | "error" | "info";
  children: ReactNode;
}) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-cyan-200 bg-cyan-50 text-cyan-900";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${className}`}>
      {children}
    </div>
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
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadRegistration() {
    const response = await fetch("/api/workshops/registration", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    });

    const payload = (await response.json()) as RegistrationApiPayload;
    if (!response.ok || !payload.ok || !payload.workshop) {
      throw new Error(payload.error || "Could not load workshop registration.");
    }

    const nextContext: WorkshopRegistrationContext = {
      workshop: payload.workshop,
      pricing: payload.pricing || null,
      registration: payload.registration || null,
      private_access: payload.private_access || null,
    };

    setContext(nextContext);
    setForm(
      formFromRegistration(
        nextContext.registration,
        payload.account?.full_name || accountName,
        payload.account?.email || accountEmail,
      ),
    );

    return nextContext;
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/workshops/registration", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });
        const payload = (await response.json()) as RegistrationApiPayload;

        if (!response.ok || !payload.ok || !payload.workshop) {
          throw new Error(payload.error || "Could not load workshop registration.");
        }
        if (cancelled) return;

        const nextContext: WorkshopRegistrationContext = {
          workshop: payload.workshop,
          pricing: payload.pricing || null,
          registration: payload.registration || null,
          private_access: payload.private_access || null,
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
    return "—";
  }, [context]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveRegistrationDetails() {
    const response = await fetch("/api/workshops/registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ ...form, age: Number(form.age) }),
    });

    const payload = (await response.json()) as RegistrationApiPayload;
    if (!response.ok || !payload.ok || !payload.registration) {
      throw new Error(payload.error || "Could not save workshop registration.");
    }

    setContext((current) =>
      current
        ? {
            ...current,
            pricing: payload.pricing || current.pricing,
            registration: payload.registration || current.registration,
            private_access: payload.private_access || current.private_access || null,
          }
        : current,
    );

    return payload.registration;
  }


  async function verifyPayment(
    registrationId: string,
    response: RazorpaySuccessResponse,
  ) {
    const verifyResponse = await fetch("/api/workshops/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        registrationId,
        ...response,
      }),
    });

    const payload = (await verifyResponse.json()) as PaymentVerifyPayload;
    if (!verifyResponse.ok || !payload.ok) {
      throw new Error(payload.error || "Could not verify workshop payment.");
    }

    if (payload.processing) {
      setMessage(payload.message || "Payment is still processing. Refresh shortly.");
      return;
    }

    if (!payload.paid || !payload.registration) {
      throw new Error("Razorpay returned without a confirmed workshop payment.");
    }

    setContext((current) =>
      current
        ? {
            ...current,
            registration: payload.registration || current.registration,
            private_access: payload.private_access || null,
          }
        : current,
    );
    setMessage(payload.message || "Payment verified. Your workshop place is confirmed.");
  }

  async function startPayment() {
    if (paying || isConfirmed) return;

    setPaying(true);
    setError("");
    setMessage("");

    try {
      const registration = await saveRegistrationDetails();
      const scriptReady = await loadRazorpayCheckout();
      const Razorpay = getRazorpayConstructor();
      if (!scriptReady || !Razorpay) {
        throw new Error("Razorpay checkout could not be loaded. Check your connection and try again.");
      }

      const createResponse = await fetch("/api/workshops/payment/create", {
        method: "POST",
        credentials: "same-origin",
      });
      const checkout = (await createResponse.json()) as PaymentCreatePayload;

      if (!createResponse.ok || !checkout.ok) {
        throw new Error(checkout.error || "Could not prepare workshop payment.");
      }

      if (checkout.alreadyPaid) {
        await loadRegistration();
        setMessage("Your workshop payment is already verified.");
        setPaying(false);
        return;
      }

      if (
        !checkout.registrationId ||
        !checkout.keyId ||
        !checkout.orderId ||
        !checkout.amountPaise ||
        !checkout.currency
      ) {
        throw new Error("The Razorpay checkout response is incomplete.");
      }

      const instance = new Razorpay({
        key: checkout.keyId,
        amount: checkout.amountPaise,
        currency: checkout.currency,
        name: "PsyLattice",
        description:
          checkout.description ||
          "Foundations of Modern Psychological Research with PsyLattice",
        order_id: checkout.orderId,
        prefill: checkout.prefill,
        notes: {
          workshop_registration_id: registration.id,
        },
        handler: async (razorpayResponse: RazorpaySuccessResponse) => {
          try {
            await verifyPayment(checkout.registrationId!, razorpayResponse);
          } catch (verifyError) {
            setError(
              verifyError instanceof Error
                ? verifyError.message
                : "Could not verify workshop payment.",
            );
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setMessage("Payment was not completed. Your registration details are still saved.");
          },
        },
        theme: { color: "#0e7490" },
      });

      instance.open();
    } catch (paymentError) {
      setPaying(false);
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Could not start workshop payment.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f9f8] text-slate-950">
      <header className="px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-slate-200/90 bg-white/95 px-5 py-3 shadow-[0_10px_30px_rgba(15,23,42,.07)] backdrop-blur sm:px-6">
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
        <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,.13)] sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-300">
                November 2026 cohort
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em]">
                Foundations of Modern Psychological Research with PsyLattice
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                One month of connected research-methods training using PsyLattice, from research foundations through ambulatory assessment, cognitive tasks and statistical measurement.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl bg-white/[.06] p-4">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">
                      Possible start date
                    </p>
                    <p className="mt-1 text-sm font-semibold">7 November 2026</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-white/[.06] p-4">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">
                      Format
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      One live hour each weekend for one month
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-white/[.06] p-4">
                  <BadgeIndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">
                      Current fee
                    </p>
                    <p className="mt-1 text-2xl font-semibold">{currentFee}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      The server recalculates the applicable fee immediately before Razorpay checkout.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-cyan-100 bg-cyan-50/60 p-5">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-cyan-800" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Payment and certificate stay connected
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Your Razorpay Payment ID, Workshop Reference, attendance and later certificate status remain attached to this PsyLattice account.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_22px_65px_rgba(15,23,42,.07)] sm:p-8">
            {loading ? (
              <div className="flex min-h-[500px] items-center justify-center">
                <div className="text-center">
                  <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-cyan-700" />
                  <p className="mt-3 text-sm text-slate-500">Loading workshop registration…</p>
                </div>
              </div>
            ) : error && !context ? (
              <StatusNotice tone="error">{error}</StatusNotice>
            ) : isConfirmed && context?.registration ? (
              <div className="py-6 sm:py-10">
                <div className="text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-7 w-7" />
                  </span>
                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[.15em] text-emerald-700">
                    Registration confirmed
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-.035em]">
                    You are registered for the workshop.
                  </h2>
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600">
                    Your Razorpay payment has been verified. Keep your Workshop Reference for support and later certificate verification.
                  </p>
                </div>

                <div className="mx-auto mt-7 grid max-w-3xl gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-[#f8fbfb] p-5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">
                      Workshop Reference
                    </p>
                    <p className="mt-2 font-mono text-base font-semibold text-slate-950">
                      {context.registration.workshop_reference || "Being generated"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-[#f8fbfb] p-5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">
                      Razorpay Payment ID
                    </p>
                    <p className="mt-2 break-all font-mono text-sm font-semibold text-slate-950">
                      {context.registration.razorpay_payment_id || "Verified"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-emerald-700">
                      Payment status
                    </p>
                    <p className="mt-2 text-sm font-semibold text-emerald-800">
                      {context.registration.status === "completed" ? "Verified · Completed" : "Verified · Paid"}
                    </p>
                  </div>
                </div>


                <div className="mx-auto mt-6 max-w-3xl rounded-[24px] border border-slate-200 bg-[#f8fbfb] p-5 sm:p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-cyan-800">
                        Your registration details
                      </p>
                      <h3 className="mt-1 text-lg font-semibold tracking-[-.025em] text-slate-950">
                        Personal details submitted before payment
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Stored with this workshop registration
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Full name", context.registration.full_name],
                      ["Age", context.registration.age],
                      ["Email ID", context.registration.contact_email],
                      ["Contact number", context.registration.contact_number],
                      ["Current city / town", context.registration.current_city],
                      ["State / region", context.registration.state_region],
                      ["Country", context.registration.country],
                      ["Institution / organization", context.registration.institution_name],
                      ["Educational qualification", context.registration.educational_qualification],
                      ["Current programme / course", context.registration.current_programme_course],
                      ["Year / semester", context.registration.year_semester || "—"],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">
                          {label}
                        </p>
                        <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                          {String(value ?? "—")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mx-auto mt-6 max-w-2xl rounded-[24px] border border-cyan-100 bg-cyan-50/55 p-5">
                  <p className="text-sm font-semibold text-slate-900">Private workshop group</p>
                  {context.private_access?.whatsapp_invite_url ? (
                    <div className="mt-3">
                      <a
                        href={context.private_access.whatsapp_invite_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-950"
                      >
                        Join WhatsApp group
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Your payment is confirmed. The private WhatsApp-group link will appear here once PsyLattice adds the invite URL.
                    </p>
                  )}
                </div>

                {context.registration.status === "completed" && context.registration.workshop_reference ? (
                  <div className="mx-auto mt-4 max-w-2xl rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-5">
                    <p className="text-sm font-semibold text-emerald-900">Your certificate is ready</p>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Complete attendance has been confirmed by PsyLattice. Your certificate is now publicly verifiable by Workshop Reference.
                    </p>
                    <a
                      href={`/api/workshops/certificate/${encodeURIComponent(context.registration.workshop_reference)}/download`}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                      <Download className="h-4 w-4" />
                      Download certificate
                    </a>
                  </div>
                ) : null}
              </div>
            ) : (
              <form
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  void startPayment();
                }}
              >
                <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.15em] text-cyan-800">
                      Workshop registration
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
                      Register and confirm your place.
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      Use the exact name you want printed on your completion certificate. Complete your details below, then continue to secure Razorpay checkout.
                    </p>
                  </div>

                  {context?.registration?.status === "pending_payment" ? (
                    <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800">
                      Details saved · payment pending
                    </span>
                  ) : null}
                </div>

                <div className="mt-7 grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  <Field
                    label="Full name for certificate"
                    value={form.full_name}
                    onChange={(value) => updateField("full_name", value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    help="Enter your name exactly as you want it to appear on the certificate."
                  />
                  <Field
                    label="Age"
                    value={form.age}
                    onChange={(value) => updateField("age", value)}
                    type="number"
                    placeholder="e.g. 22"
                    autoComplete="off"
                  />
                  <Field
                    label="Email ID"
                    value={form.contact_email}
                    onChange={(value) => updateField("contact_email", value)}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  <Field
                    label="Contact number"
                    value={form.contact_number}
                    onChange={(value) => updateField("contact_number", value)}
                    placeholder="Include country code if applicable"
                    autoComplete="tel"
                  />
                  <Field
                    label="Current city / town"
                    value={form.current_city}
                    onChange={(value) => updateField("current_city", value)}
                    placeholder="e.g. Guwahati"
                    autoComplete="address-level2"
                  />
                  <Field
                    label="State / region"
                    value={form.state_region}
                    onChange={(value) => updateField("state_region", value)}
                    placeholder="e.g. Assam"
                    autoComplete="address-level1"
                  />
                  <Field
                    label="Country"
                    value={form.country}
                    onChange={(value) => updateField("country", value)}
                    placeholder="e.g. India"
                    autoComplete="country-name"
                  />
                  <Field
                    label="Current institution / organization"
                    value={form.institution_name}
                    onChange={(value) => updateField("institution_name", value)}
                    placeholder="University, college, institute or organization"
                    autoComplete="organization"
                  />
                  <Field
                    label="Educational qualification"
                    value={form.educational_qualification}
                    onChange={(value) => updateField("educational_qualification", value)}
                    placeholder="e.g. BA Psychology"
                  />
                  <Field
                    label="Current programme / course"
                    value={form.current_programme_course}
                    onChange={(value) => updateField("current_programme_course", value)}
                    placeholder="e.g. MSc Psychology"
                  />
                  <Field
                    label="Year / semester"
                    value={form.year_semester}
                    onChange={(value) => updateField("year_semester", value)}
                    placeholder="Optional"
                    required={false}
                  />
                </div>

                <div className="mt-7 rounded-[24px] border border-slate-200 bg-[#f8fbfb] p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-800" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Registration record</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        PsyLattice uses these details for workshop administration, payment support, attendance records and certificate issuance. Public certificate verification will not expose your age, phone number, email or payment details.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {error ? <StatusNotice tone="error">{error}</StatusNotice> : null}
                  {message ? <StatusNotice tone="success">{message}</StatusNotice> : null}
                </div>

                <div className="mt-7 border-t border-slate-200 pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Current fee</p>
                      <p className="mt-1 text-2xl font-semibold tracking-[-.035em] text-slate-950">
                        {currentFee}
                      </p>
                      <p className="mt-1 max-w-md text-[11px] leading-5 text-slate-400">
                        The final amount is determined server-side when Razorpay checkout is created.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:items-end">
                      <button
                        type="submit"
                        disabled={paying || !context?.pricing}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-950 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {paying ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                        {paying ? "Opening Razorpay…" : `Continue to payment · ${currentFee}`}
                      </button>
                      <p className="text-[11px] text-slate-400">Secure checkout powered by Razorpay.</p>
                    </div>
                  </div>
                </div>

                {!context?.pricing ? (
                  <p className="mt-4 text-xs leading-5 text-amber-700">
                    Workshop registration is not currently inside an active pricing window.
                  </p>
                ) : null}
              </form>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
