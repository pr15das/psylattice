"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CheckCircle2, LoaderCircle, LockKeyhole, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function WorkshopAuthGate() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function ensureProfile(userId: string, name: string | null) {
    const supabase = createClient();
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    const profileData = {
      id: userId,
      full_name: name || null,
      role: "self",
      workspace_access: ["self", "researcher", "clinician"],
      updated_at: new Date().toISOString(),
    };

    if (!existingProfile) {
      await supabase.from("profiles").upsert(profileData, { onConflict: "id" });
      return;
    }

    await supabase
      .from("profiles")
      .update({
        workspace_access: ["self", "researcher", "clinician"],
        ...(name ? { full_name: name } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  async function finishSignedInUser(userId: string, metadataName: string | null) {
    const supabase = createClient();
    const { data: accessState } = await supabase
      .from("psylattice_account_access")
      .select("status, suspended_until")
      .eq("user_id", userId)
      .maybeSingle();

    const activeSuspension =
      accessState?.status === "suspended" &&
      (!accessState.suspended_until || new Date(accessState.suspended_until).getTime() > Date.now());

    if (
      accessState?.status === "banned" ||
      accessState?.status === "deleting" ||
      activeSuspension
    ) {
      router.replace("/account-restricted");
      router.refresh();
      return;
    }

    await ensureProfile(userId, metadataName);
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();
    const supabase = createClient();

    try {
      if (mode === "signin") {
        if (!normalizedEmail || !password) throw new Error("Enter your email and password.");

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError || !data.user) throw new Error(signInError?.message || "Sign in failed.");

        const metadataName =
          typeof data.user.user_metadata?.full_name === "string"
            ? data.user.user_metadata.full_name.trim()
            : null;

        await finishSignedInUser(data.user.id, metadataName);
        return;
      }

      if (!normalizedName) throw new Error("Enter your full name.");
      if (!normalizedEmail) throw new Error("Enter your email address.");
      if (password.length < 8) throw new Error("Use a password with at least 8 characters.");

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/workshops/register")}`,
          data: {
            full_name: normalizedName,
            workspace_access: ["self", "researcher", "clinician"],
          },
        },
      });

      if (signUpError || !data.user) throw new Error(signUpError?.message || "Account creation failed.");

      if (data.session) {
        await ensureProfile(data.user.id, normalizedName);
        router.refresh();
        return;
      }

      setMessage("Your PsyLattice account was created. Confirm your email address, then return here and sign in to continue workshop registration.");
      setMode("signin");
      setPassword("");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.08)] sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800">
        <LockKeyhole className="h-5 w-5" />
      </div>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[.15em] text-cyan-800">Register now</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-slate-950">
        Use your PsyLattice account to continue.
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Your payment status, Workshop Reference, WhatsApp access and later certificate remain attached to one PsyLattice account.
      </p>

      <div className="mt-6 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => { setMode("signin"); setError(""); setMessage(""); }}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${mode === "signin" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${mode === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" ? (
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Full name</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/60"
              placeholder="Your full name"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/60"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/60"
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
          />
        </label>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {message ? (
          <div className="flex gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-950 disabled:bg-slate-300"
        >
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : mode === "signup" ? <UserPlus className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
          {busy ? "Please wait…" : mode === "signup" ? "Create account & continue" : "Sign in & continue"}
        </button>
      </form>
    </div>
  );
}
