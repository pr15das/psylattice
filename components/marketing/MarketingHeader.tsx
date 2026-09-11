"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";

export default function MarketingHeader() {
  const [open, setOpen] = useState(false);

  const nav = [
    ["Features", "/#features"],
    ["Workflow", "/#workflow"],
    ["Mobile", "/#mobile"],
    ["AI", "/#trusted-ai"],
    ["Pricing", "/#pricing"],
  ] as const;

  return (
    <header className="sticky top-3 z-50 px-3 sm:px-5 lg:px-8">
      <div className="mx-auto flex h-[66px] max-w-[1380px] items-center justify-between rounded-[22px] border border-slate-200/90 bg-white/95 px-4 shadow-[0_12px_34px_rgba(15,23,42,.08)] backdrop-blur-xl sm:px-5">
        <div className="shrink-0">
          <PsyLatticeLogo />
        </div>

        <nav className="hidden items-center gap-7 text-[12px] font-semibold text-slate-500 lg:flex">
          {nav.map(([label, href]) => (
            <a key={label} href={href} className="transition hover:text-cyan-900">
              {label}
            </a>
          ))}
          <Link href="/security" className="transition hover:text-cyan-900">
            Security
          </Link>
          <Link href="/about" className="transition hover:text-cyan-900">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/signin"
            className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/signin"
            className="hidden items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-cyan-950 sm:inline-flex"
          >
            Start free
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-auto mt-2 max-w-[1380px] rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,.12)] lg:hidden">
          <div className="grid gap-1">
            {nav.map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {label}
              </a>
            ))}
            <Link href="/security" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Security
            </Link>
            <Link href="/about" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              About
            </Link>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <Link href="/signin" className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                Sign in
              </Link>
              <Link href="/signin" className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white">
                Start free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
