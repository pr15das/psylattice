"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import ResearchAiAssistant from "@/components/ResearchAiAssistant";

type Props = {
  studyId: string;
  studyTitle: string;
};

export default function ResearchExplorerAiDock({ studyId, studyTitle }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[170] bg-slate-950/20 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {open && (
        <aside
          className="fixed bottom-4 right-4 z-[180] flex h-[min(780px,calc(100vh-32px))] w-[min(460px,calc(100vw-24px))] min-w-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,.26)] sm:right-6"
          aria-label="Explorer AI"
        >
          <div className="shrink-0 border-b border-slate-100 bg-[linear-gradient(120deg,#f0fdff_0%,#ffffff_58%,#faf7ff_100%)] px-4 py-3">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-white text-cyan-800 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-slate-950">
                    Explorer AI
                  </p>
                  <p className="truncate text-[8px] text-slate-400">
                    Ask about the current study data and dataset structure.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900"
                aria-label="Close Explorer AI"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <ResearchAiAssistant
              studyId={studyId}
              studyTitle={studyTitle}
              variant="dock"
            />
          </div>
        </aside>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-4 z-[190] flex items-center gap-2 rounded-full border border-cyan-200 bg-slate-950 px-4 py-3 text-[10px] font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,.22)] transition hover:-translate-y-0.5 sm:right-6"
          aria-expanded={open}
          aria-label="Open Explorer AI"
        >
          <Sparkles className="h-4 w-4 text-cyan-300" />
          Explorer AI
        </button>
      )}
    </>
  );
}
