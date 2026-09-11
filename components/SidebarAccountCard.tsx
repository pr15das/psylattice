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
        className="mx-auto mt-8 flex h-11 w-11 items-center justify-center rounded-full border border-cyan-200/80 bg-gradient-to-br from-white to-cyan-50 text-xs font-bold text-cyan-900 shadow-[0_4px_12px_rgba(8,145,178,0.13),0_12px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-px hover:border-cyan-300"
      >
        {summary ? initials : <UserRound className="h-4 w-4" />}
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      className="group mt-8 flex items-center gap-3 rounded-[22px] border border-cyan-200/80 bg-gradient-to-br from-white via-white to-cyan-50/80 p-3.5 text-left shadow-[0_4px_14px_rgba(8,145,178,0.09),0_16px_36px_rgba(15,23,42,0.07)] transition hover:-translate-y-px hover:border-cyan-300 hover:shadow-[0_8px_18px_rgba(8,145,178,0.12),0_18px_40px_rgba(15,23,42,0.08)]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-200 bg-white text-xs font-bold text-cyan-900 shadow-sm">
        {summary ? initials : <UserRound className="h-4 w-4" />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-slate-900">
          {name}
        </span>
        <span className="mt-0.5 block truncate text-[10px] font-semibold text-cyan-800">
          {plan}
        </span>
        <span className="mt-1 block text-[10px] text-slate-400">
          Manage account
        </span>
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-cyan-700" />
    </Link>
  );
}
