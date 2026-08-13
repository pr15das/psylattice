"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import { createClient } from "@/lib/supabase/client";

type WorkspaceId = "self" | "researcher" | "clinician";

const workspaces: Array<{
  id: WorkspaceId;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  note: string;
}> = [
  {
    id: "self",
    eyebrow: "Personal",
    title: "Self workspace",
    description:
      "Use self-assessments, daily monitoring, self-regulation, progress tools and the AI Guide.",
    href: "/self",
    note: "Your personal psychological workspace.",
  },
  {
    id: "researcher",
    eyebrow: "Research",
    title: "Researcher workspace",
    description:
      "Build studies, questionnaires, participant workflows, datasets and exports.",
    href: "/researcher",
    note: "Research tools are linked to your same PsyLattice login.",
  },
  {
    id: "clinician",
    eyebrow: "Professional",
    title: "Clinician workspace",
    description:
      "Use professional assessment and client-management workflows as they become available.",
    href: "/clinician",
    note: "Access does not constitute verification of professional credentials or licensure.",
  },
];

export default function WorkspacePage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/signin");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, workspace_access")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Could not load workspace profile:", profileError);
      }

      const name =
        profile?.full_name?.trim() ||
        (typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "") ||
        user.email?.split("@")[0] ||
        "there";

      setFullName(name);

      if (
        !Array.isArray(profile?.workspace_access) ||
        !["self", "researcher", "clinician"].every((workspace) =>
          profile?.workspace_access?.includes(workspace)
        )
      ) {
        const { error: repairError } = await supabase
          .from("profiles")
          .update({
            workspace_access: ["self", "researcher", "clinician"],
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (repairError) {
          console.error(
            "Could not repair workspace access:",
            repairError
          );
        }
      }

      setLoading(false);
    }

    void loadAccount();
  }, [router]);

  async function rememberWorkspace(workspace: WorkspaceId) {
    const supabase = createClient();

    const { error } = await supabase.rpc(
      "psylattice_set_last_workspace",
      {
        p_workspace: workspace,
      }
    );

    if (error) {
      console.error("Could not remember workspace:", error);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out failed:", error);
      setSigningOut(false);
      return;
    }

    router.replace("/signin");
    router.refresh();
  }

  const firstName =
    fullName.trim().split(/\s+/)[0] || "there";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <PsyLatticeLogo />

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm font-medium text-slate-500 hover:text-slate-950 sm:inline"
            >
              Website
            </Link>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-900">
            One account · Three workspaces
          </span>

          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {loading
              ? "Loading your workspaces..."
              : `Welcome, ${firstName}.`}
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
            Choose how you want to use PsyLattice right now. Your Self,
            Researcher and Clinician workspaces all belong to this same
            account and login.
          </p>
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={workspace.href}
              onClick={() => void rememberWorkspace(workspace.id)}
              className="group flex min-h-[315px] flex-col rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_20px_55px_rgba(15,23,42,0.07)]"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800">
                {workspace.eyebrow}
              </span>

              <h2 className="mt-4 text-xl font-semibold tracking-tight">
                {workspace.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {workspace.description}
              </p>

              <div className="mt-auto pt-8">
                <p className="text-xs leading-5 text-slate-400">
                  {workspace.note}
                </p>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                  <span>Open workspace</span>
                  <span
                    aria-hidden="true"
                    className="transition group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium">
            Your workspaces use the same account, but their data stays
            organised by purpose.
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Personal Self data, researcher-owned studies and professional
            Clinician workflows should remain separated in their respective
            database structures and permissions even though you access them
            through one login.
          </p>
        </div>
      </section>
    </main>
  );
}
