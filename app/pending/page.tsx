"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PendingPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      router.replace(user ? "/workspace" : "/signin");
    }

    void redirect();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center">
        <p className="font-medium text-slate-950">
          Opening your PsyLattice workspaces…
        </p>
        <p className="mt-2 text-sm text-slate-500">
          One account now includes Self, Researcher and Clinician access.
        </p>
      </div>
    </main>
  );
}
