"use client";

import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export default function AdminWorkshopShortcut() {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const existing = document.querySelector<HTMLElement>("[data-psylattice-workshop-admin-link]");
    if (existing) {
      setHost(existing);
      return;
    }

    const sidebarNav = document.querySelector<HTMLElement>("main aside .space-y-1");
    if (!sidebarNav) return;

    const mount = document.createElement("div");
    mount.setAttribute("data-psylattice-workshop-admin-link", "true");
    sidebarNav.appendChild(mount);
    setHost(mount);

    return () => {
      mount.remove();
    };
  }, []);

  if (!host) return null;

  return createPortal(
    <Link
      href="/admin/workshops"
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <BookOpenCheck className="h-4 w-4" />
      </span>
      Workshops
    </Link>,
    host,
  );
}
