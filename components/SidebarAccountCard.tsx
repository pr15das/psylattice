"use client";

import Link from "next/link";
import { ChevronRight, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AccountSummary = {
  ok?: boolean;
  profile?: {
    full_name?: string | null;
  } | null;
  account?: {
    email?: string;
  };
  billing?: {
    planLabel?: string;
  };
};

function initialsFor(name: string, email: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0] || ""}${words[words.length - 1][0] || ""}`.toUpperCase();
  }

  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "PL";
}

export default function SidebarAccountCard({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const [summary, setSummary] = useState<AccountSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/account/summary", {
          cache: "no-store",
        });
        const result = (await response.json()) as AccountSummary;
        if (!cancelled && response.ok && result.ok) setSummary(result);
      } catch {
        // The card has a quiet fallback so account-summary failure never breaks navigation.
      }
    }

    void load();
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
    };
  }, []);

  const name = summary?.profile?.full_name?.trim() || "Your account";
  const email = summary?.account?.email || "";
  const plan = summary?.billing?.planLabel || "Account";
  const initials = useMemo(() => initialsFor(name, email), [name, email]);

  if (collapsed) {
    return (
      <Link
        href="/account"
        title={`${name} · ${plan}`}
        aria-label="Manage PsyLattice account"
        className="group mx-auto mt-8 flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/30 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 text-xs font-bold text-white shadow-[0_8px_24px_rgba(15,23,42,0.22),0_0_0_1px_rgba(34,211,238,0.04)] transition-all duration-200 hover:-translate-y-px hover:border-cyan-300/60 hover:shadow-[0_10px_28px_rgba(15,23,42,0.28),0_0_22px_rgba(34,211,238,0.10)]"
      >
        {summary ? initials : <UserRound className="h-4 w-4 text-cyan-200" />}
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="group relative mt-8 flex items-center gap-3 overflow-hidden rounded-[22px] border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/90 p-3.5 text-left shadow-[0_10px_28px_rgba(15,23,42,0.20),0_1px_2px_rgba(15,23,42,0.10)] transition-all duration-200 hover:-translate-y-px hover:border-cyan-400/45 hover:shadow-[0_14px_34px_rgba(15,23,42,0.25),0_0_28px_rgba(34,211,238,0.08)]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl transition group-hover:bg-cyan-400/15"
      />

      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-white/10 text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_5px_14px_rgba(0,0,0,0.18)] backdrop-blur-sm">
        {summary ? initials : <UserRound className="h-4 w-4 text-cyan-200" />}
      </span>

      <span className="relative min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-white">
          {name}
        </span>
        <span className="mt-0.5 block truncate text-[10px] font-semibold text-cyan-300">
          {plan}
        </span>
        <span className="mt-1 block text-[10px] text-slate-400 transition-colors group-hover:text-slate-300">
          Manage account
        </span>
      </span>

      <ChevronRight className="relative h-4 w-4 shrink-0 text-slate-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-cyan-300" />
    </Link>
  );
}
