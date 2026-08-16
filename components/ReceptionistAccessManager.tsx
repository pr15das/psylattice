"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type ReceptionistLink = {
  id: string;
  access_token: string;
  label: string;
  status: "active" | "paused";
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
};

export default function ReceptionistAccessManager() {
  const [link, setLink] =
    useState<ReceptionistLink | null>(
      null
    );
  const [loading, setLoading] =
    useState(true);
  const [working, setWorking] =
    useState(false);
  const [label, setLabel] =
    useState(
      "Receptionist appointment management"
    );
  const [message, setMessage] =
    useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  const portalUrl = useMemo(() => {
    if (!link) {
      return "";
    }

    const base =
      process.env
        .NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "");

    return `${base.replace(
      /\/+$/,
      ""
    )}/receptionist/${link.access_token}`;
  }, [link]);

  async function loadLink() {
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_my_receptionist_link"
      );

    if (error) {
      setErrorMessage(
        error.message ||
          "Receptionist access could not be loaded."
      );
      setLoading(false);
      return;
    }

    const rows =
      (data ||
        []) as ReceptionistLink[];

    setLink(rows[0] || null);

    if (rows[0]?.label) {
      setLabel(rows[0].label);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadLink();
  }, []);

  async function createLink() {
    if (working) {
      return;
    }

    if (
      link &&
      !window.confirm(
        "Create a new receptionist link? The current link will stop working immediately."
      )
    ) {
      return;
    }

    setWorking(true);
    setErrorMessage("");
    setMessage("");

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_create_receptionist_link",
        {
          p_label:
            label.trim() ||
            "Receptionist appointment management",
        }
      );

    if (error) {
      setErrorMessage(
        error.message ||
          "A receptionist link could not be created."
      );
      setWorking(false);
      return;
    }

    const rows =
      (data ||
        []) as ReceptionistLink[];

    setLink(rows[0] || null);
    setMessage(
      "Receptionist management link created."
    );
    setWorking(false);
  }

  async function togglePause() {
    if (!link || working) {
      return;
    }

    setWorking(true);
    setErrorMessage("");
    setMessage("");

    const next =
      link.status === "active"
        ? "paused"
        : "active";

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_set_receptionist_link_status",
        {
          p_link_id: link.id,
          p_status: next,
        }
      );

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "Receptionist access could not be changed."
      );
      setWorking(false);
      return;
    }

    setLink({
      ...link,
      status: next,
    });

    setMessage(
      next === "paused"
        ? "Receptionist access paused."
        : "Receptionist access resumed."
    );
    setWorking(false);
  }

  async function removeLink() {
    if (
      !link ||
      working ||
      !window.confirm(
        "Remove this receptionist link? Anyone using it will lose access immediately."
      )
    ) {
      return;
    }

    setWorking(true);
    setErrorMessage("");
    setMessage("");

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_remove_receptionist_link",
        {
          p_link_id: link.id,
        }
      );

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "Receptionist access could not be removed."
      );
      setWorking(false);
      return;
    }

    setLink(null);
    setMessage(
      "Receptionist management link removed."
    );
    setWorking(false);
  }

  async function copyLink() {
    if (!portalUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        portalUrl
      );
      setMessage(
        "Receptionist link copied."
      );
    } catch {
      setErrorMessage(
        "Could not copy the link automatically."
      );
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-cyan-50/40 p-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Delegated scheduling
            </p>

            {link && (
              <span
                className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold ${
                  link.status ===
                  "active"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {link.status ===
                "active"
                  ? "Receptionist access active"
                  : "Access paused"}
              </span>
            )}
          </div>

          <h3 className="mt-2 text-lg font-semibold text-slate-950">
            Receptionist appointment management
          </h3>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Create a private management link for a receptionist or scheduling assistant. The portal can manage appointments and appointment requests, but it cannot access private clinician notes, assessments, monitoring data or messages.
          </p>
        </div>

        {!link && (
          <button
            type="button"
            disabled={
              loading || working
            }
            onClick={() =>
              void createLink()
            }
            className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-xs font-semibold text-white disabled:opacity-40"
          >
            + Create receptionist link
          </button>
        )}
      </div>

      <div className="p-5">
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
            {message}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-400">
            Loading receptionist access...
          </p>
        ) : !link ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">
                Link label
              </span>
              <input
                value={label}
                onChange={(event) =>
                  setLabel(
                    event.target.value
                  )
                }
                placeholder="e.g. Front desk appointment management"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
              />
            </label>

            <button
              type="button"
              disabled={working}
              onClick={() =>
                void createLink()
              }
              className="rounded-xl bg-cyan-800 px-5 py-3 text-xs font-semibold text-white disabled:opacity-40"
            >
              Create secure link
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Management link
                </p>
                <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-600">
                  {portalUrl}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void copyLink()
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600"
                >
                  Copy link
                </button>

                {link.status ===
                  "active" && (
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white"
                  >
                    Open portal
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {link.label}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Created{" "}
                  {new Date(
                    link.created_at
                  ).toLocaleDateString()}
                  {link.last_used_at
                    ? ` · Last used ${new Date(
                        link.last_used_at
                      ).toLocaleString()}`
                    : " · Not used yet"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={working}
                  onClick={() =>
                    void togglePause()
                  }
                  className={`rounded-xl border px-4 py-2.5 text-xs font-semibold disabled:opacity-40 ${
                    link.status ===
                    "active"
                      ? "border-amber-200 text-amber-700"
                      : "border-emerald-200 text-emerald-700"
                  }`}
                >
                  {link.status ===
                  "active"
                    ? "Pause access"
                    : "Resume access"}
                </button>

                <button
                  type="button"
                  disabled={working}
                  onClick={() =>
                    void createLink()
                  }
                  className="rounded-xl border border-cyan-200 px-4 py-2.5 text-xs font-semibold text-cyan-700 disabled:opacity-40"
                >
                  Create new link
                </button>

                <button
                  type="button"
                  disabled={working}
                  onClick={() =>
                    void removeLink()
                  }
                  className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600 disabled:opacity-40"
                >
                  Remove link
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
              <p className="text-xs leading-5 text-amber-800">
                Treat this URL like a password. Anyone who has an active copy of the link can manage appointment scheduling for this clinician. Pause or remove it immediately if access should stop.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
