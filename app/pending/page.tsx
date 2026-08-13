"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type WorkspaceRole = "self" | "researcher" | "clinician";

function workspacePath(role: WorkspaceRole) {
  if (role === "researcher") return "/researcher";
  if (role === "clinician") return "/clinician";
  return "/self";
}

function normalizeRole(value: unknown): WorkspaceRole {
  const role = String(value || "").toLowerCase();

  if (role === "researcher") return "researcher";
  if (role === "clinician") return "clinician";
  return "self";
}

export default function PendingPage() {
  const router = useRouter();

  useEffect(() => {
    async function leaveLegacyPendingRoute() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/signin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role = normalizeRole(
        profile?.role || user.user_metadata?.role
      );

      router.replace(workspacePath(role));
    }

    void leaveLegacyPendingRoute();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center">
        <p className="font-medium text-slate-950">
          Opening your PsyLattice workspace…
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Researcher and Clinician accounts no longer use an approval queue.
        </p>
      </div>
    </main>
  );
}
