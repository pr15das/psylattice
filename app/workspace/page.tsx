"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import { createClient } from "@/lib/supabase/client";

type WorkspaceId =
  | "self"
  | "researcher"
  | "clinician";

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
    note: "Research tools use this same PsyLattice account.",
  },
  {
    id: "clinician",
    eyebrow: "Professional",
    title: "Clinician workspace",
    description:
      "Use PsyLattice's professional assessment and client-management workflows.",
    href: "/clinician",
    note: "Workspace access does not represent verification of professional credentials or licensure.",
  },
];

export default function WorkspacePage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [openingWorkspace, setOpeningWorkspace] =
    useState<WorkspaceId | null>(null);
  const [signingOut, setSigningOut] =
    useState(false);
  const [pageError, setPageError] =
    useState("");

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

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            "full_name, workspace_access"
          )
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error(
          "Could not load workspace profile:",
          profileError
        );
      }

      const name =
        profile?.full_name?.trim() ||
        (typeof user.user_metadata?.full_name ===
        "string"
          ? user.user_metadata.full_name.trim()
          : "") ||
        user.email?.split("@")[0] ||
        "there";

      setFullName(name);

      const access = Array.isArray(
        profile?.workspace_access
      )
        ? profile.workspace_access
        : [];

      const hasAllWorkspaces = [
        "self",
        "researcher",
        "clinician",
      ].every((workspace) =>
        access.includes(workspace)
      );

      if (!hasAllWorkspaces) {
        const { error: repairError } =
          await supabase
            .from("profiles")
            .update({
              workspace_access: [
                "self",
                "researcher",
                "clinician",
              ],
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", user.id);

        if (repairError) {
          console.error(
            "Could not repair workspace access:",
            repairError
          );

          setPageError(
            "PsyLattice could not refresh your workspace profile. You can still try opening a workspace."
          );
        }
      }

      setLoading(false);
    }

    void loadAccount();
  }, [router]);

  function openWorkspace(
    workspace: WorkspaceId,
    href: string
  ) {
    if (openingWorkspace) return;

    setOpeningWorkspace(workspace);

    // IMPORTANT:
    // We intentionally do NOT read or write profiles.role here.
    // We also avoid Next <Link> prefetching for the workspace
    // destinations so an old/cached redirect cannot decide
    // which workspace opens.
    router.push(href);
  }

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    const supabase = createClient();

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Sign out failed:",
        error
      );
      setSigningOut(false);
      return;
    }

    router.replace("/signin");
    router.refresh();
  }

  const firstName =
    fullName.trim().split(/\s+/)[0] ||
    "there";

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
              onClick={() =>
                void handleSignOut()
              }
              disabled={signingOut}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {signingOut
                ? "Signing out..."
                : "Sign out"}
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
            Choose how you want to use
            PsyLattice right now. Self,
            Researcher and Clinician all use
            this same account.
          </p>
        </div>

        {pageError && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm leading-6 text-amber-800">
              {pageError}
            </p>
          </div>
        )}

        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          {workspaces.map((workspace) => {
            const isOpening =
              openingWorkspace === workspace.id;

            return (
              <article
                key={workspace.id}
                className="flex min-h-[315px] flex-col rounded-3xl border border-slate-200 bg-white p-6"
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

                  <button
                    type="button"
                    onClick={() =>
                      openWorkspace(
                        workspace.id,
                        workspace.href
                      )
                    }
                    disabled={
                      loading ||
                      openingWorkspace !== null
                    }
                    className="mt-4 flex w-full items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    <span>
                      {isOpening
                        ? "Opening..."
                        : "Open workspace"}
                    </span>
                    <span aria-hidden="true">
                      →
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium">
            Workspace choice is navigation,
            not an account role.
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Selecting Self, Researcher or
            Clinician only decides which
            interface opens. It does not
            change your account and it does
            not remove access to the other
            two workspaces.
          </p>
        </div>
      </section>
    </main>
  );
}