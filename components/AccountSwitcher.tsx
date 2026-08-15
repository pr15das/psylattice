"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type PsyLatticeWorkspace =
  | "self"
  | "researcher"
  | "clinician";

type AccountSwitcherProps = {
  initials: string;
  currentWorkspace: PsyLatticeWorkspace;
  title?: string;
};

const workspaceOptions: Array<{
  id: PsyLatticeWorkspace;
  label: string;
  description: string;
  href: string;
  icon: ReactNode;
}> = [
  {
    id: "self",
    label: "Personal / Self",
    description: "Assessments, monitoring and personal progress",
    href: "/self",
    icon: "S",
  },
  {
    id: "researcher",
    label: "Researcher",
    description: "Studies, participants and research data",
    href: "/researcher",
    icon: "R",
  },
  {
    id: "clinician",
    label: "Clinician",
    description: "Connected clients and authorised clinical data",
    href: "/workspace",
    icon: "C",
  },
];

export default function AccountSwitcher({
  initials,
  currentWorkspace,
  title = "Switch workspace",
}: AccountSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );
    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  const cleanInitials =
    initials.trim().slice(0, 3).toUpperCase() || "PL";

  return (
    <div
      ref={rootRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setOpen((current) => !current)
        }
        aria-haspopup="menu"
        aria-expanded={open}
        title={title}
        className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold transition ${
          open
            ? "bg-cyan-100 text-cyan-900 ring-2 ring-cyan-100"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        {cleanInitials}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+12px)] z-[80] w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.16)]"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Switch workspace
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Use the same PsyLattice account in a different workspace.
            </p>
          </div>

          <div className="p-2">
            {workspaceOptions.map((workspace) => {
              const active =
                workspace.id === currentWorkspace;

              return (
                <Link
                  key={workspace.id}
                  role="menuitem"
                  href={workspace.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 transition ${
                    active
                      ? "bg-cyan-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                      active
                        ? "bg-cyan-800 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {workspace.icon}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-semibold ${
                        active
                          ? "text-cyan-950"
                          : "text-slate-800"
                      }`}
                    >
                      {workspace.label}
                    </span>

                    <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                      {workspace.description}
                    </span>
                  </span>

                  {active && (
                    <span className="rounded-full border border-cyan-200 bg-white px-2 py-1 text-[10px] font-semibold text-cyan-800">
                      CURRENT
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
