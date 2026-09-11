"use client";

import Link from "next/link";
import {
  ChevronDown,
  FlaskConical,
  LogOut,
  Settings2,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Workspace = "self" | "researcher" | "clinician";

type AccountSummary = {
  ok?: boolean;
  account?: {
    email?: string;
  };
  profile?: {
    full_name?: string | null;
  } | null;
  billing?: {
    planLabel?: string;
  };
};

type AccountSwitcherProps = {
  initials?: string;
  currentWorkspace: Workspace;
  title?: string;
};

const workspaceItems: Array<{
  id: Workspace;
  label: string;
  description: string;
  href: string;
  icon: typeof UserRound;
}> = [
  {
    id: "self",
    label: "Personal / Self",
    description: "Assessments, monitoring and personal progress",
    href: "/self",
    icon: UserRound,
  },
  {
    id: "researcher",
    label: "Researcher",
    description: "Studies, participants and research data",
    href: "/researcher",
    icon: FlaskConical,
  },
  {
    id: "clinician",
    label: "Clinician",
    description: "Connected clients and authorised clinical data",
    href: "/clinician",
    icon: Stethoscope,
  },
];

function initialsFor(name: string, email: string, fallback: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0]?.[0] || ""}${words[words.length - 1]?.[0] || ""}`.toUpperCase();
  }

  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  if (fallback.trim()) return fallback.trim().slice(0, 2).toUpperCase();
  return "PL";
}

export default function AccountSwitcher({
  initials = "",
  currentWorkspace,
  title = "",
}: AccountSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [adminRole, setAdminRole] = useState<"admin" | "super_admin" | null>(null);
  const [signOutError, setSignOutError] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      try {
        const [accountResponse, adminResponse] = await Promise.all([
          fetch("/api/account/summary", {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin",
          }),
          fetch("/api/admin/me", {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin",
          }),
        ]);

        const result = (await accountResponse.json()) as AccountSummary;
        if (!cancelled && accountResponse.ok && result.ok) setSummary(result);

        const adminResult = (await adminResponse.json().catch(() => ({}))) as {
          ok?: boolean;
          isAdmin?: boolean;
          admin?: { role?: "admin" | "super_admin" } | null;
        };
        if (!cancelled) {
          setAdminRole(
            adminResponse.ok && adminResult.isAdmin && adminResult.admin?.role
              ? adminResult.admin.role
              : null,
          );
        }
      } catch {
        // A quiet fallback keeps workspace switching available even if account
        // metadata is briefly unavailable.
      }
    }

    void loadAccount();
    const onFocus = () => void loadAccount();
    window.addEventListener("focus", onFocus);
    window.addEventListener("psylattice-profile-refresh", onFocus);
    window.addEventListener("psylattice-billing-refresh", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("psylattice-profile-refresh", onFocus);
      window.removeEventListener("psylattice-billing-refresh", onFocus);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function closeOnOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const accountName =
    summary?.profile?.full_name?.trim() || title.trim() || "Your PsyLattice account";
  const email = summary?.account?.email?.trim() || "";
  const plan = summary?.billing?.planLabel || "PsyLattice account";
  const displayInitials = useMemo(
    () => initialsFor(accountName, email, initials),
    [accountName, email, initials],
  );

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.assign("/signin");
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : "Sign out failed.");
      setSigningOut(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={accountName}
        className={`group flex h-10 items-center gap-1.5 rounded-full border px-1.5 pr-2 shadow-sm transition hover:-translate-y-px hover:shadow-md ${
          open
            ? "border-cyan-300 bg-cyan-50 text-cyan-950"
            : "border-slate-200 bg-white text-slate-700 hover:border-cyan-200"
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-cyan-50 text-[11px] font-bold text-cyan-900 ring-1 ring-cyan-200/80">
          {displayInitials}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[76] cursor-default bg-transparent"
          />
          <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-[96] w-[340px] overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18),0_4px_18px_rgba(8,145,178,0.08)]"
        >
          <div className="border-b border-slate-100 bg-gradient-to-br from-white via-white to-cyan-50/80 px-4 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan-200 bg-white text-sm font-bold text-cyan-900 shadow-sm">
                {displayInitials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-950">{accountName}</p>
                {email && <p className="mt-0.5 truncate text-[11px] text-slate-500">{email}</p>}
                <span className="mt-2 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-cyan-800">
                  {plan}
                </span>
              </div>
            </div>
          </div>

          <div className="p-2.5">
            <p className="px-2 pb-2 pt-1 text-[9px] font-bold uppercase tracking-[0.17em] text-slate-400">
              Workspaces
            </p>

            <div className="space-y-1">
              {workspaceItems.map((workspace) => {
                const Icon = workspace.icon;
                const current = currentWorkspace === workspace.id;
                return (
                  <Link
                    key={workspace.id}
                    href={workspace.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
                      current
                        ? "bg-cyan-50 text-cyan-950"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        current
                          ? "bg-cyan-800 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{workspace.label}</span>
                        {current && (
                          <span className="rounded-full border border-cyan-200 bg-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-cyan-700">
                            Current
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">
                        {workspace.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 p-2.5">
            {adminRole && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="mb-1 flex items-center gap-3 rounded-2xl px-3 py-3 text-cyan-900 transition hover:bg-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-800">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-xs font-semibold">Admin console</span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">
                    {adminRole === "super_admin" ? "Super Admin" : "Admin"} · accounts and billing operations
                  </span>
                </span>
              </Link>
            )}

            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-slate-700 transition hover:bg-white hover:text-slate-950"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600">
                <Settings2 className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-xs font-semibold">Manage account</span>
                <span className="mt-0.5 block text-[10px] text-slate-500">
                  Profile, plan, payments and security
                </span>
              </span>
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-slate-700 transition hover:bg-white hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                <LogOut className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-xs font-semibold">
                  {signingOut ? "Signing out…" : "Sign out"}
                </span>
                <span className="mt-0.5 block text-[10px] text-slate-500">
                  End this PsyLattice session
                </span>
              </span>
            </button>

            {signOutError && (
              <p className="px-3 pb-1 pt-2 text-[10px] leading-4 text-rose-600">{signOutError}</p>
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
