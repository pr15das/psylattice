"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup";

const workspaces = [
  {
    title: "Self",
    label: "For Myself",
    description:
      "Personal assessment, monitoring, reflection and self-regulation tools.",
  },
  {
    title: "Research",
    label: "Researcher",
    description:
      "Build studies, questionnaires, participant workflows and research datasets.",
  },
  {
    title: "Professional",
    label: "Clinician",
    description:
      "Clinical tools for professional use. Additional verification may be required for certain features.",
  },
];

export default function SignInPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  useEffect(() => {
    async function redirectExistingSession() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email_confirmed_at) {
        router.replace("/workspace");
        return;
      }

      if (user && !user.email_confirmed_at) {
        await supabase.auth.signOut();
      }
    }

    void redirectExistingSession();
  }, [router]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setVerificationEmail(null);
    setAuthError("");
    setAuthMessage("");
  }

  async function ensureProfile(
    userId: string,
    name: string | null
  ) {
    const supabase = createClient();

    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Could not check profile:", profileError);
    }

    const profileData = {
      id: userId,
      full_name: name || null,
      role: "self",
      workspace_access: ["self", "researcher", "clinician"],
      updated_at: new Date().toISOString(),
    };

    if (!existingProfile) {
      const { error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "id" });

      if (error) {
        console.error("Could not create profile:", error);
      }

      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        workspace_access: ["self", "researcher", "clinician"],
        ...(name ? { full_name: name } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Could not update workspace access:", error);
    }
  }

  async function handleSignIn(
    event: React.FormEvent<HTMLFormElement>
  ) {
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
      const message = error?.message || "Sign in failed.";

      setAuthError(
        message.toLowerCase().includes("email not confirmed")
          ? "Please confirm your email address before signing in."
          : message
      );
      setSubmitting(false);
      return;
    }

    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      setAuthError("Please confirm your email address before signing in.");
      setSubmitting(false);
      return;
    }

    const metadataName =
      typeof data.user.user_metadata?.full_name === "string"
        ? data.user.user_metadata.full_name.trim()
        : null;

    await ensureProfile(data.user.id, metadataName);

    router.replace("/workspace");
    router.refresh();
  }

  async function handleSignUp(
    event: React.FormEvent<HTMLFormElement>
  ) {
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: normalizedName,
          workspace_access: ["self", "researcher", "clinician"],
        },
      },
    });

    if (error || !data.user) {
      setAuthError(error?.message || "Account creation failed.");
      setSubmitting(false);
      return;
    }

    // With Supabase "Confirm email" enabled, signUp must return a user
    // but no session. If a session is returned, the project is allowing
    // unverified accounts to sign in, so fail closed instead of navigating.
    if (data.session) {
      await supabase.auth.signOut();
      setAuthError(
        "Account creation is temporarily unavailable because email verification is not being enforced. Please try again later."
      );
      setSubmitting(false);
      return;
    }

    setVerificationEmail(normalizedEmail);
    setAuthMessage("");
    setPassword("");
    setSubmitting(false);
  }

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
              One account · Three workspaces
            </span>

            <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Welcome to PsyLattice.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-slate-500 sm:text-lg">
              Create one PsyLattice account and use the Self, Researcher and
              Clinician workspaces whenever you need them.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:max-w-2xl">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.title}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-800">
                    {workspace.title}
                  </span>

                  <p className="mt-2 text-sm font-semibold">
                    {workspace.label}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {workspace.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium">
                One account, connected access
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                You do not create separate Self, Researcher or Clinician
                accounts. The same login opens the workspace selector. For the
                Clinician workspace, additional verification may be required
                for certain professional features. Workspace access alone does
                not represent verification of professional qualifications.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center border-t border-slate-200 bg-white px-5 py-10 sm:px-8 lg:h-full lg:items-start lg:overflow-y-auto lg:border-l lg:border-t-0 lg:px-10">
          <div className="mx-auto w-full max-w-md lg:py-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_70px_rgba(15,23,42,0.06)] sm:p-7">
              {verificationEmail ? (
                <div className="py-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </div>

                  <h2 className="mt-6 text-2xl font-semibold tracking-tight">
                    Check your email
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    We sent a verification link to
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-950">
                    {verificationEmail}
                  </p>

                  <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-4">
                    <p className="text-sm font-medium text-cyan-950">
                      Confirm your email before signing in
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-cyan-900/75">
                      Open the email from PsyLattice and click the confirmation
                      button. Your account will remain locked until the email
                      address is verified.
                    </p>
                  </div>

                  <p className="mt-5 text-xs leading-5 text-slate-400">
                    If you do not see the message, check your spam or junk folder.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setVerificationEmail(null);
                      setMode("signin");
                      setAuthError("");
                      setAuthMessage("");
                    }}
                    className="mt-7 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Back to sign in
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVerificationEmail(null);
                      setMode("signup");
                      setEmail("");
                      setAuthError("");
                      setAuthMessage("");
                    }}
                    className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <>
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
                        ? "One login gives you access to all three PsyLattice workspaces."
                        : "Your account automatically includes Self, Researcher and Clinician access."}
                    </p>
                  </div>

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
                          onChange={(event) =>
                            setFullName(event.target.value)
                          }
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
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
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
                          : "Create PsyLattice account"}
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
                </>
              )}
            </div>

            
          </div>
        </section>
      </div>
    </main>
  );
}
