"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import { createClient } from "@/lib/supabase/client";

type WorkspaceRole = "self" | "researcher" | "clinician";
type AuthMode = "signin" | "signup";

const workspaces: Array<{
  role: WorkspaceRole;
  title: string;
  shortTitle: string;
  description: string;
  badge: string;
}> = [
  {
    role: "self",
    title: "For Myself",
    shortTitle: "Self",
    description:
      "Personal assessment, monitoring, reflection and self-regulation tools.",
    badge: "Self",
  },
  {
    role: "researcher",
    title: "Researcher",
    shortTitle: "Researcher",
    description:
      "Build studies, questionnaires, participant workflows and research datasets.",
    badge: "Research",
  },
  {
    role: "clinician",
    title: "Clinician",
    shortTitle: "Clinician",
    description:
      "Use PsyLattice's professional workspace. Professional credentials are not verified by PsyLattice.",
    badge: "Professional",
  },
];

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

export default function SignInPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [selectedRole, setSelectedRole] =
    useState<WorkspaceRole>("self");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    async function redirectExistingSession() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

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

    void redirectExistingSession();
  }, [router]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setAuthError("");
    setAuthMessage("");
  }

  async function ensureProfile(
    userId: string,
    userMetadata: Record<string, unknown> | undefined,
    fallbackRole?: WorkspaceRole
  ) {
    const supabase = createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Could not load profile:", profileError);
    }

    if (profile?.role) {
      return normalizeRole(profile.role);
    }

    const metadataRole = normalizeRole(
      userMetadata?.role || fallbackRole || "self"
    );

    const metadataName =
      typeof userMetadata?.full_name === "string"
        ? userMetadata.full_name.trim()
        : "";

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name: metadataName || null,
          role: metadataRole,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (upsertError) {
      console.error("Could not repair profile:", upsertError);
    }

    return metadataRole;
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    setAuthError("");
    setAuthMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setAuthError("Enter your email and password.");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data.user) {
      setAuthError(error?.message || "Sign in failed.");
      setSubmitting(false);
      return;
    }

    const role = await ensureProfile(
      data.user.id,
      data.user.user_metadata
    );

    router.replace(workspacePath(role));
    router.refresh();
  }

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    setAuthError("");
    setAuthMessage("");

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName) {
      setAuthError("Enter your full name.");
      return;
    }

    if (!normalizedEmail) {
      setAuthError("Enter your email address.");
      return;
    }

    if (password.length < 8) {
      setAuthError("Use a password with at least 8 characters.");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: normalizedName,
          role: selectedRole,
        },
      },
    });

    if (error || !data.user) {
      setAuthError(error?.message || "Account creation failed.");
      setSubmitting(false);
      return;
    }

    // If normal email confirmation is OFF, Supabase returns a session and the
    // user can enter the selected workspace immediately.
    if (data.session) {
      await ensureProfile(
        data.user.id,
        {
          ...data.user.user_metadata,
          full_name: normalizedName,
          role: selectedRole,
        },
        selectedRole
      );

      router.replace(workspacePath(selectedRole));
      router.refresh();
      return;
    }

    // If normal email confirmation is ON, there is no session yet. This is
    // ordinary account email verification — NOT researcher/clinician approval.
    setAuthMessage(
      `Your ${workspaces
        .find((workspace) => workspace.role === selectedRole)
        ?.shortTitle.toLowerCase()} account was created. Confirm your email address, then sign in. There is no professional credential or admin approval step.`
    );

    setMode("signin");
    setPassword("");
    setSubmitting(false);
  }

  const selectedWorkspace =
    workspaces.find((workspace) => workspace.role === selectedRole) ||
    workspaces[0];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <PsyLatticeLogo />

          <Link
            href="/"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            Back to website
          </Link>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl lg:h-[calc(100vh-73px)] lg:min-h-0 lg:grid-cols-[1fr_540px] lg:overflow-hidden">
        <section className="flex items-center px-5 py-12 sm:px-8 lg:h-full lg:overflow-hidden lg:px-10 lg:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-900">
              Secure workspace entry
            </span>

            <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Welcome to PsyLattice.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-slate-500 sm:text-lg">
              Access a personal, research, or professional psychological
              workspace with one straightforward account flow.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:max-w-2xl">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.role}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-800">
                    {workspace.badge}
                  </span>
                  <p className="mt-2 text-sm font-semibold">
                    {workspace.title}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {workspace.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium">
                Open account creation
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Researcher and Clinician workspaces do not require
                professional credential verification or administrator
                approval. Choosing the Clinician workspace does not represent
                verification of professional qualification or licensure by
                PsyLattice.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center border-t border-slate-200 bg-white px-5 py-10 sm:px-8 lg:h-full lg:items-start lg:overflow-y-auto lg:border-l lg:border-t-0 lg:px-10">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_70px_rgba(15,23,42,0.06)] sm:p-7">
              <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    mode === "signin"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Sign in
                </button>

                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    mode === "signup"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Create account
                </button>
              </div>

              <div className="mt-7">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {mode === "signin"
                    ? "Sign in to PsyLattice"
                    : "Create your PsyLattice account"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {mode === "signin"
                    ? "PsyLattice will open the workspace attached to your account."
                    : "Choose whichever workspace you want to create. There is no researcher or clinician approval queue."}
                </p>
              </div>

              {mode === "signup" && (
                <div className="mt-6">
                  <p className="text-sm font-medium">Choose workspace</p>

                  <div className="mt-3 grid gap-2">
                    {workspaces.map((workspace) => {
                      const selected = selectedRole === workspace.role;

                      return (
                        <button
                          key={workspace.role}
                          type="button"
                          onClick={() => setSelectedRole(workspace.role)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-cyan-700 bg-cyan-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold">
                                {workspace.title}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {workspace.description}
                              </p>
                            </div>

                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                selected
                                  ? "border-cyan-700 bg-cyan-700 text-white"
                                  : "border-slate-300"
                              }`}
                            >
                              {selected ? "✓" : ""}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500">
                      Creating:{" "}
                      <span className="font-semibold text-slate-800">
                        {selectedWorkspace.shortTitle} account
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <form
                onSubmit={
                  mode === "signin" ? handleSignIn : handleSignUp
                }
                className="mt-6 space-y-4"
              >
                {mode === "signup" && (
                  <label className="block">
                    <span className="text-sm font-medium">Full name</span>
                    <input
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Your name"
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>
                )}

                <label className="block">
                  <span className="text-sm font-medium">Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Password</span>
                  <input
                    type="password"
                    autoComplete={
                      mode === "signin"
                        ? "current-password"
                        : "new-password"
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={
                      mode === "signup"
                        ? "At least 8 characters"
                        : "Your password"
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                {authError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm leading-6 text-red-700">
                      {authError}
                    </p>
                  </div>
                )}

                {authMessage && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-sm leading-6 text-emerald-800">
                      {authMessage}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? mode === "signin"
                      ? "Signing in..."
                      : "Creating account..."
                    : mode === "signin"
                      ? "Sign in"
                      : `Create ${selectedWorkspace.shortTitle} account`}
                </button>
              </form>

              <p className="mt-5 text-center text-xs leading-5 text-slate-400">
                By continuing, you agree to PsyLattice's{" "}
                <Link href="/terms" className="underline">
                  Terms
                </Link>{" "}
                and acknowledge the{" "}
                <Link href="/privacy" className="underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
