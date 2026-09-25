"use client";

import { useState } from "react";
import { BadgeCheck, Download, LoaderCircle, Search } from "lucide-react";

type CertificatePayload = {
  ok?: boolean;
  error?: string;
  certificate?: {
    recipient_name: string;
    workshop_title: string;
    cohort_label: string;
    workshop_reference: string;
    completed_at: string;
    certificate_issued_at: string;
    status: "verified";
  };
};

export default function WorkshopCertificateLookup() {
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [certificate, setCertificate] = useState<CertificatePayload["certificate"] | null>(null);

  async function verify() {
    const value = reference.trim().toUpperCase();
    if (!value) return;

    setLoading(true);
    setError("");
    setCertificate(null);

    try {
      const response = await fetch(`/api/workshops/certificate/${encodeURIComponent(value)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as CertificatePayload;
      if (!response.ok || !payload.ok || !payload.certificate) {
        throw new Error(payload.error || "No issued certificate was found for that reference.");
      }
      setCertificate(payload.certificate);
      setReference(payload.certificate.workshop_reference);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Certificate verification failed.");
    } finally {
      setLoading(false);
    }
  }

  const downloadUrl = certificate
    ? `/api/workshops/certificate/${encodeURIComponent(certificate.workshop_reference)}/download`
    : "";

  return (
    <div className="rounded-[30px] border border-slate-200 bg-[#f8fbfb] p-6 shadow-[0_22px_60px_rgba(15,23,42,.06)] sm:p-8">
      <label htmlFor="workshop-reference" className="text-xs font-semibold text-slate-700">
        Workshop Reference
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <div className="flex min-h-12 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 focus-within:border-cyan-300 focus-within:ring-4 focus-within:ring-cyan-100/60">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            id="workshop-reference"
            name="reference"
            value={reference}
            onChange={(event) => setReference(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void verify();
              }
            }}
            placeholder="PSY-W26-XXXXXX"
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            aria-describedby="verification-status"
          />
        </div>
        <button
          type="button"
          onClick={() => void verify()}
          disabled={loading || !reference.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-950 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
          Verify certificate
        </button>
      </div>

      {certificate ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/75 p-4">
          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Verified PsyLattice certificate</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{certificate.recipient_name}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{certificate.workshop_title}</p>
              <p className="mt-1 text-xs text-slate-500">{certificate.cohort_label} · {certificate.workshop_reference}</p>
            </div>
          </div>
        </div>
      ) : null}

      <a
        href={downloadUrl || undefined}
        aria-disabled={!certificate}
        className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition ${
          certificate
            ? "border-slate-200 bg-white text-slate-800 hover:border-cyan-200 hover:text-cyan-900"
            : "pointer-events-none border-slate-200 bg-white text-slate-400"
        }`}
      >
        <Download className="h-4 w-4" />
        Download certificate
      </a>

      <p id="verification-status" className={`mt-3 text-xs leading-5 ${error ? "text-rose-600" : "text-slate-500"}`}>
        {error ||
          (certificate
            ? "Certificate verified. The issued certificate is available for public download."
            : "A certificate becomes publicly verifiable only after complete attendance is confirmed by a PsyLattice admin.")}
      </p>
    </div>
  );
}
