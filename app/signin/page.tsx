"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup" | "forgot";

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
      "Use PsyLattice's professional workspace. Professional credentials are not verified by PsyLattice.",
  },
];

export default function SignInPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetError = params.get("error");

    if (resetError) {
      const messages: Record<string, string> = {
        invalid_password_reset_link:
          "That password reset link is invalid or incomplete. Request a new link below.",
        password_reset_callback_failed:
          "That password reset link could not be verified or has expired. Request a new link below.",
      };

      setAuthError(
        messages[resetError] ||
          "Authentication could not be completed. Please try again."
      );
    }

    async function redirectExistingSession() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/workspace");
      }
    }

    void redirectExistingSession();
  }, [router]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword("");
    setShowPassword(false);
    setAuthError("");
    setAuthMessage("");
  }

  async function handleForgotPassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) return;

    setAuthError("");
    setAuthMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setAuthError("Enter the email address for your PsyLattice account.");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback/password-reset`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      { redirectTo }
    );

    if (error) {
      if (error.message.toLowerCase().includes("rate")) {
        setAuthError(
          "Too many reset requests were made. Please wait a moment and try again."
        );
      } else {
        setAuthError(
          "We could not send the reset email right now. Please try again."
        );
      }

      setSubmitting(false);
      return;
    }

    // Keep this message deliberately generic so the form does not reveal
    // whether an email address is registered with PsyLattice.
    setAuthMessage(
      "If a PsyLattice account exists for that email address, a password reset link has been sent. Check your inbox and spam folder."
    );
    setSubmitting(false);
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
      setAuthError(error?.message || "Sign in failed.");
      setSubmitting(false);
      return;
    }

    const metadataName =
      typeof data.user.user_metadata?.full_name === "string"
        ? data.user.user_metadata.full_name.trim()
        : null;

    // Restricted accounts are still allowed to authenticate so PsyLattice can
    // show the dedicated restriction page. Check that state before touching
    // normal user tables such as profiles, which are intentionally blocked by
    // the Phase 8C restrictive RLS gate.
    const { data: accessState, error: accessError } = await supabase
      .from("psylattice_account_access")
      .select("status, suspended_until")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (accessError) {
      console.error("Could not check account access:", accessError);
    }

    const suspensionIsActive =
      accessState?.status === "suspended" &&
      !!accessState.suspended_until &&
      new Date(accessState.suspended_until).getTime() > Date.now();

    const accountIsRestricted =
      accessState?.status === "banned" ||
      accessState?.status === "deleting" ||
      suspensionIsActive;

    if (accountIsRestricted) {
      router.replace("/account-restricted");
      router.refresh();
      return;
    }

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

    if (data.session) {
      await ensureProfile(data.user.id, normalizedName);

      router.replace("/workspace");
      router.refresh();
      return;
    }

    setAuthMessage(
      "Your PsyLattice account was created with access to Self, Researcher and Clinician workspaces. Confirm your email address, then sign in."
    );

    setMode("signin");
    setPassword("");
    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-[#f6fafb] text-slate-950">
      <header className="px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-slate-200/90 bg-white/95 px-5 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08),0_2px_8px_rgba(15,23,42,0.05)] backdrop-blur sm:px-6">
          <PsyLatticeLogo />

          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-[0_5px_16px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-900"
          >
            Back to website
          </Link>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-92px)] max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_520px] lg:gap-8 lg:py-8">
        <section className="flex items-center px-2 py-8 sm:px-4 lg:py-12">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-semibold text-cyan-900 shadow-[0_7px_22px_rgba(8,145,178,0.12)]">
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
                  className="rounded-[24px] border border-slate-200/90 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.07),0_2px_7px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_18px_36px_rgba(15,23,42,0.10),0_3px_10px_rgba(8,145,178,0.06)]"
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

            <div className="mt-8 rounded-[26px] border border-cyan-100 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.07),0_2px_8px_rgba(8,145,178,0.05)]">
              <p className="text-sm font-medium">
                All three are included automatically
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                You do not create separate Self, Researcher or Clinician
                accounts. The same login opens a workspace selector where you
                can enter any of the three. PsyLattice does not verify
                professional qualifications merely because someone uses the
                Clinician workspace.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center py-4 lg:items-start">
          <div className="mx-auto w-full max-w-md lg:py-8">
            <div className="rounded-[30px] border border-slate-200/90 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12),0_5px_18px_rgba(8,145,178,0.06)] sm:p-7">
              <div className="grid grid-cols-2 rounded-full border border-slate-200 bg-slate-50 p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    mode === "signin"
                      ? "bg-white text-slate-950 shadow-[0_5px_14px_rgba(15,23,42,0.10)]"
                      : "text-slate-500"
                  }`}
                >
                  Sign in
                </button>

                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    mode === "signup"
                      ? "bg-white text-slate-950 shadow-[0_5px_14px_rgba(15,23,42,0.10)]"
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
                    : mode === "signup"
                      ? "Create your PsyLattice account"
                      : "Reset your password"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {mode === "signin"
                    ? "One login gives you access to all three PsyLattice workspaces."
                    : mode === "signup"
                      ? "Your account automatically includes Self, Researcher and Clinician access."
                      : "Enter your account email and we will send you a secure reset link."}
                </p>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {mode === "forgot"
                    ? "Password recovery"
                    : mode === "signin"
                      ? "Available after sign in"
                      : "Included with your account"}
                </p>
                {mode === "forgot" ? (
                  <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 px-4 py-3 text-sm leading-6 text-slate-600">
                    We will email a single-use recovery link. For your security,
                    PsyLattice will not confirm whether an address is registered.
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-3">
                    {["Self", "Researcher", "Clinician"].map((workspace) => (
                      <div
                        key={workspace}
                        className="flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50/55 px-3 py-2.5 shadow-[0_5px_14px_rgba(8,145,178,0.07)]"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-300 bg-white text-[11px] font-bold text-cyan-800 shadow-[0_2px_6px_rgba(8,145,178,0.10)]">
                          ✓
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          {workspace}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form
                onSubmit={
                  mode === "signin"
                    ? handleSignIn
                    : mode === "signup"
                      ? handleSignUp
                      : handleForgotPassword
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
                      className="mt-2 w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm shadow-[0_6px_18px_rgba(15,23,42,0.06)] outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/70"
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
                    className="mt-2 w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm shadow-[0_6px_18px_rgba(15,23,42,0.06)] outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/70"
                  />
                </label>

                {mode !== "forgot" && (
                  <label className="block">
                    <span className="text-sm font-medium">Password</span>
                    <div className="relative mt-2">
                      <input
                        type={showPassword ? "text" : "password"}
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
                        className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 pr-12 text-sm shadow-[0_6px_18px_rgba(15,23,42,0.06)] outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/70"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="absolute inset-y-0 right-1 flex w-10 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                            <path d="M3 3l18 18" strokeLinecap="round" />
                            <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" strokeLinecap="round" />
                            <path d="M9.9 4.3A10.8 10.8 0 0 1 12 4c5.3 0 9 4.6 9 8a8.7 8.7 0 0 1-2.1 4" strokeLinecap="round" />
                            <path d="M6.2 6.2C4.2 7.6 3 9.8 3 12c0 3.4 3.7 8 9 8 1.5 0 2.9-.4 4.1-1" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                            <path d="M2.8 12s3.5-6 9.2-6 9.2 6 9.2 6-3.5 6-9.2 6-9.2-6-9.2-6Z" />
                            <circle cx="12" cy="12" r="2.7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </label>
                )}

                {mode === "signin" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-sm font-semibold text-cyan-800 transition hover:text-cyan-950 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {authError && (
                  <div className="flex items-start gap-3 px-1 py-1">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                    <p className="text-sm leading-6 text-rose-700">
                      {authError}
                    </p>
                  </div>
                )}

                {authMessage && (
                  <div className="flex items-start gap-3 px-1 py-1">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-600" />
                    <p className="text-sm leading-6 text-cyan-900">
                      {authMessage}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.20)] transition hover:-translate-y-0.5 hover:bg-cyan-950 hover:shadow-[0_14px_30px_rgba(8,145,178,0.20)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? mode === "signin"
                      ? "Signing in..."
                      : mode === "signup"
                        ? "Creating account..."
                        : "Sending reset link..."
                    : mode === "signin"
                      ? "Sign in"
                      : mode === "signup"
                        ? "Create PsyLattice account"
                        : "Send reset link"}
                </button>
              </form>

              {mode === "forgot" && (
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="mt-3 w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-900"
                >
                  Back to sign in
                </button>
              )}

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
