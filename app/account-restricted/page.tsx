"use client";

import Link from "next/link";
import { Ban, Clock3, LifeBuoy, LogOut, ShieldOff } from "lucide-react";
import { useEffect, useState } from "react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import { createClient } from "@/lib/supabase/client";

type Access = {
  status: "active" | "suspended" | "banned" | "deleting";
  suspended_until: string | null;
  public_message: string | null;
};

function formatUntil(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export default function AccountRestrictedPage() {
  const [access, setAccess] = useState<Access | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        window.location.replace("/signin");
        return;
      }

      const { data, error } = await supabase
        .from("psylattice_account_access")
        .select("status, suspended_until, public_message")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setAccess({
          status: "deleting",
          suspended_until: null,
          public_message: "PsyLattice could not verify your account access. Please contact support.",
        });
        setLoading(false);
        return;
      }

      const row = data as Access | null;
      const expired =
        row?.status === "suspended" &&
        row.suspended_until &&
        new Date(row.suspended_until).getTime() <= Date.now();

      if (!row || row.status === "active" || expired) {
        window.location.replace("/workspace");
        return;
      }

      setAccess(row);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/signin");
  }

  const isSuspended = access?.status === "suspended";
  const isBanned = access?.status === "banned";
  const Icon = isSuspended ? Clock3 : isBanned ? Ban : ShieldOff;
  const title = isSuspended
    ? "Your account has been suspended by PsyLattice"
    : isBanned
      ? "You have been banned by PsyLattice"
      : "Your PsyLattice account is unavailable";

  return (
    <main className="min-h-screen bg-[#f4f7f8] px-5 py-10 text-slate-950 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col">
        <div className="flex items-center justify-between">
          <PsyLatticeLogo />
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={signingOut}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>

        <div className="flex flex-1 items-center py-12">
          <section className="w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
            <div className="border-b border-slate-100 bg-gradient-to-br from-slate-950 to-slate-800 px-7 py-8 text-white sm:px-10 sm:py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Account access</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.04em] sm:text-4xl">{loading ? "Checking your PsyLattice account…" : title}</h1>
            </div>

            {!loading && access && (
              <div className="space-y-6 px-7 py-8 sm:px-10 sm:py-10">
                <div>
                  <p className="text-sm leading-7 text-slate-600">
                    {isSuspended
                      ? "Access to PsyLattice workspaces is temporarily disabled for this account."
                      : isBanned
                        ? "Access to PsyLattice workspaces has been disabled for this account."
                        : "This account cannot currently access PsyLattice workspaces."}
                  </p>
                  {isSuspended && access.suspended_until && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
                      <span className="font-semibold">Suspended until:</span> {formatUntil(access.suspended_until)}
                    </div>
                  )}
                  {access.public_message && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
                      {access.public_message}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
                  <p className="text-sm font-semibold text-slate-900">Need help with this restriction?</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">If you believe this action was made in error or need clarification, contact the PsyLattice team.</p>
                  <Link
                    href="/contact"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <LifeBuoy className="h-4 w-4" />
                    Contact PsyLattice
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
