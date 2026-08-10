"use client";

import { useRouter } from "next/navigation";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import { createClient } from "@/lib/supabase/client";

export default function PendingPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/signin");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <PsyLatticeLogo />

          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center justify-center px-6 py-16">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50">
            <span className="text-xl text-cyan-800">✓</span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
            Professional verification
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Your workspace is awaiting verification.
          </h1>

          <p className="mt-5 leading-7 text-slate-600">
            Researcher and clinician workspaces require verification before
            professional tools can be accessed.
          </p>

          <p className="mt-3 leading-7 text-slate-600">
            Once your account has been verified, you will be able to access
            your PsyLattice professional workspace.
          </p>

          <button
            onClick={handleSignOut}
            className="mt-8 rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Return to sign in
          </button>
        </div>
      </section>
    </main>
  );
}