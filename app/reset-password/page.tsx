"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkRecoverySession() {
      const supabase = createClient();

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setErrorMessage(
          "This password reset link is invalid or has expired. Request a new reset link from the sign-in page."
        );
      }

      setCheckingSession(false);
    }

    void checkRecoverySession();
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) return;

    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setErrorMessage(
        error.message || "Your password could not be updated."
      );
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setPassword("");
    setConfirmPassword("");
    setSubmitting(false);

    // End the recovery session so the user signs in again with the new password.
    await supabase.auth.signOut();
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

      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center justify-center px-5 py-12 sm:px-8 lg:px-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_70px_rgba(15,23,42,0.06)] sm:p-7">
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
              <path d="M7 10V8a5 5 0 0 1 10 0v2" />
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M12 14v2" />
            </svg>
          </div>

          {checkingSession ? (
            <>
              <h1 className="mt-6 text-2xl font-semibold tracking-tight">
                Checking your reset link
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Please wait while PsyLattice verifies your password reset session.
              </p>
            </>
          ) : success ? (
            <>
              <h1 className="mt-6 text-2xl font-semibold tracking-tight">
                Password updated
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Your PsyLattice password has been changed successfully. Sign in
                again using your new password.
              </p>

              <button
                type="button"
                onClick={() => router.replace("/signin")}
                className="mt-7 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Return to sign in
              </button>
            </>
          ) : (
            <>
              <h1 className="mt-6 text-2xl font-semibold tracking-tight">
                Choose a new password
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Create a new password for your PsyLattice account.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-4"
              >
                <label className="block">
                  <span className="text-sm font-medium">New password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    disabled={Boolean(errorMessage && !password && !confirmPassword)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-50"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Confirm new password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Enter it again"
                    disabled={Boolean(errorMessage && !password && !confirmPassword)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-50"
                  />
                </label>

                {errorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm leading-6 text-red-700">
                      {errorMessage}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || Boolean(errorMessage && !password && !confirmPassword)}
                  className="w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Updating password..." : "Update password"}
                </button>
              </form>

              <Link
                href="/signin"
                className="mt-3 block w-full rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
              >
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}