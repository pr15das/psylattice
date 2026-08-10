"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";

type Workspace = "self" | "researcher" | "clinician";
type Mode = "signin" | "signup";

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("signin");
  const [workspace, setWorkspace] = useState<Workspace>("self");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSignUp() {
    setLoading(true);
    setError("");
    setMessage("");

    if (!fullName.trim()) {
      setError("Please enter your name.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      setLoading(false);
      return;
    }

const { data, error } = await supabase.auth.signUp({
  email: email.trim(),
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      full_name: fullName.trim(),
      workspace_role: workspace,
    },
  },
});

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setMessage(
        "Account created. Check your email and confirm your email address."
      );
    } else {
      setMessage("Account created successfully.");
    }

    setLoading(false);
  }

  async function handleSignIn() {
    setLoading(true);
    setError("");
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Unable to sign in.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("workspace_role, verification_status")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      setError("Could not load your PsyLattice profile.");
      setLoading(false);
      return;
    }

    if (profile.workspace_role !== workspace) {
      await supabase.auth.signOut();

      setError(
        `This account belongs to the ${profile.workspace_role} workspace.`
      );

      setLoading(false);
      return;
    }

    if (profile.workspace_role === "self") {
      router.push("/self");
      router.refresh();
      return;
    }

    if (profile.verification_status !== "verified") {
      router.push("/pending");
      router.refresh();
      return;
    }

    if (profile.workspace_role === "researcher") {
      router.push("/researcher");
    }

    if (profile.workspace_role === "clinician") {
      router.push("/clinician");
    }

    router.refresh();
  }

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (mode === "signup") {
      await handleSignUp();
    } else {
      await handleSignIn();
    }
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
         <PsyLatticeLogo />

          <Link href="/" className="text-sm text-slate-500">
            Back to website
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <span className="w-fit rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-800">
            Secure workspace entry
          </span>

          <h1 className="mt-6 text-5xl font-semibold tracking-tight">
            Welcome to
            <br />
            PsyLattice.
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
            Access your personal, research or professional psychological
            workspace.
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/40">
          {/* SIGN IN / CREATE ACCOUNT SWITCH */}

          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError("");
                setMessage("");
              }}
              className={`rounded-lg py-3 text-sm font-semibold ${
                mode === "signin"
                  ? "bg-white shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
              }}
              className={`rounded-lg py-3 text-sm font-semibold ${
                mode === "signup"
                  ? "bg-white shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Create account
            </button>
          </div>

          <h2 className="mt-7 text-2xl font-semibold">
            {mode === "signin"
              ? "Sign in to your workspace"
              : "Create your PsyLattice account"}
          </h2>

          {/* WORKSPACE */}

          <p className="mt-6 text-sm font-medium">Choose workspace</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              ["self", "For Myself"],
              ["researcher", "Researcher"],
              ["clinician", "Clinician"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setWorkspace(id as Workspace)}
                className={`rounded-xl border px-3 py-3 text-sm font-medium ${
                  workspace === id
                    ? "border-cyan-700 bg-cyan-50 text-cyan-900"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "signup" && workspace !== "self" && (
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              Researcher and Clinician accounts require professional
              verification before access is granted.
            </div>
          )}

          {/* FORM */}

          <div className="mt-6 space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="text-sm font-medium">Full name</span>

                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium">Email</span>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Password</span>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "signup"
                    ? "At least 8 characters"
                    : "Your password"
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
              />
            </label>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </div>
      </section>
    </main>
  );
}