"use client";

import { useParams } from "next/navigation";
import CognitivePilotRunner from "@/components/CognitivePilotRunner";

export default function CognitivePilotPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params?.token === "string" ? params.token : "";

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8f8] p-6 text-slate-950">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Pilot link unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">This PsyLattice cognitive pilot link is incomplete.</p>
        </div>
      </main>
    );
  }

  return (
    <CognitivePilotRunner
      token={token}
      onClose={() => {
        window.location.assign("/");
      }}
    />
  );
}
