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
    note:
      "Your personal psychological workspace.",
  },
  {
    id: "researcher",
    eyebrow: "Research",
    title: "Researcher workspace",
    description:
      "Build studies, questionnaires, participant workflows, datasets and exports.",
    href: "/researcher",
    note:
      "Research tools use this same PsyLattice account.",
  },
  {
    id: "clinician",
    eyebrow: "Professional",
    title: "Clinician workspace",
    description:
      "Use PsyLattice's professional assessment and client-management workflows.",
    href: "/clinician",
    note:
      "Workspace access does not represent verification of professional credentials or licensure.",
  },
];

export default function WorkspacePage() {
  const router = useRouter();

  const [fullName, setFullName] =
    useState("");

  const [userId, setUserId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [
    openingWorkspace,
    setOpeningWorkspace,
  ] = useState<WorkspaceId | null>(
    null
  );

  const [
    signingOut,
    setSigningOut,
  ] = useState(false);

  const [pageError, setPageError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      const supabase =
        createClient();

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (
        userError ||
        !user
      ) {
        router.replace(
          "/signin"
        );

        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "full_name, workspace_access"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (profileError) {
        console.error(
          "Could not load workspace profile:",
          profileError
        );
      }

      setUserId(user.id);

      const name =
        profile?.full_name?.trim() ||
        (typeof user
          .user_metadata
          ?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "") ||
        user.email?.split("@")[0] ||
        "there";

      setFullName(name);

      const access =
        Array.isArray(
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
        const {
          error: repairError,
        } = await supabase
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

        if (
          cancelled
        ) {
          return;
        }

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

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function openWorkspace(
    workspace: WorkspaceId,
    href: string
  ) {
    if (openingWorkspace) {
      return;
    }

    setOpeningWorkspace(workspace);
    setPageError("");

    /*
     * The page has already authenticated the user in loadAccount().
     * Do not call auth.getUser() again here.
     *
     * Re-checking auth during the button click could send an already
     * authenticated user back to /signin if that second client-side
     * request briefly fails or the session is still being refreshed.
     */
    if (!userId) {
      setOpeningWorkspace(null);

      setPageError(
        "Your signed-in session is still loading. Please try opening the workspace again."
      );

      return;
    }

    const supabase = createClient();

    /*
     * Check onboarding only. RLS on workspace_onboarding still protects
     * this row, so the client cannot read another user's onboarding state.
     */
    const {
      data: onboarding,
      error: onboardingError,
    } = await supabase
      .from("workspace_onboarding")
      .select("current_step, completed_at")
      .eq("user_id", userId)
      .eq("workspace", workspace)
      .maybeSingle();

    /*
     * If onboarding state cannot be checked, never lock the user out of
     * the product. Open the requested workspace normally.
     */
    if (onboardingError) {
      console.error(
        "Could not check workspace onboarding:",
        onboardingError
      );

      router.push(href);
      return;
    }

    /*
     * Completed tour: open the workspace.
     */
    if (onboarding?.completed_at) {
      router.push(href);
      return;
    }

    /*
     * First visit or partially completed tour: open/resume onboarding.
     */
    router.push(
      `/onboarding?workspace=${workspace}`
    );
  }

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    const supabase =
      createClient();

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

    router.replace(
      "/signin"
    );

    router.refresh();
  }

  const firstName =
    fullName
      .trim()
      .split(/\s+/)[0] ||
    "there";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <PsyLatticeLogo />

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm font-medium text-slate-500 transition hover:text-slate-950 sm:inline"
            >
              Website
            </Link>

            <button
              type="button"
              onClick={() =>
                void handleSignOut()
              }
              disabled={
                signingOut
              }
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-50"
            >
              {signingOut
                ? "Signing out..."
                : "Sign out"}
            </button>
          </div>
        </div>
      </header>

      {/* PAGE */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-900">
            One account · Three
            workspaces
          </span>

          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {loading
              ? "Loading your workspaces..."
              : `Welcome, ${firstName}.`}
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
            Choose how you want
            to use PsyLattice right
            now. Self, Researcher
            and Clinician all use
            this same account.
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            The first time you open
            a workspace, PsyLattice
            will give you a short
            visual tour. You can
            skip it at any time.
          </p>
        </div>

        {/* ERROR */}
        {pageError && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm leading-6 text-amber-800">
              {pageError}
            </p>
          </div>
        )}

        {/* WORKSPACE CARDS */}
        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          {workspaces.map(
            (workspace) => {
              const isOpening =
                openingWorkspace ===
                workspace.id;

              return (
                <article
                  key={
                    workspace.id
                  }
                  className="flex min-h-[315px] flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800">
                    {
                      workspace.eyebrow
                    }
                  </span>

                  <h2 className="mt-4 text-xl font-semibold tracking-tight">
                    {
                      workspace.title
                    }
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {
                      workspace.description
                    }
                  </p>

                  <div className="mt-auto pt-8">
                    <p className="text-xs leading-5 text-slate-400">
                      {
                        workspace.note
                      }
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void openWorkspace(
                          workspace.id,
                          workspace.href
                        )
                      }
                      disabled={
                        loading ||
                        openingWorkspace !==
                          null
                      }
                      className="mt-4 flex w-full items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"
                    >
                      <span>
                        {isOpening
                          ? "Checking..."
                          : "Open workspace"}
                      </span>

                      <span
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>

        {/* ACCOUNT EXPLANATION */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium">
            Workspace choice is
            navigation, not an
            account role.
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Selecting Self,
            Researcher or Clinician
            only decides which
            interface opens. It
            does not change your
            account and it does
            not remove access to
            the other two
            workspaces.
          </p>
        </div>
      </section>
    </main>
  );
}