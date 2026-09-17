"use client";

import { useEffect, useState } from "react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import { createClient } from "@/lib/supabase/client";

type HandoffResult = {
  ok?: boolean;
  link_token?: string;
  session_token?: string;
};

export default function MobileParticipantHandoffPage() {
  const [message, setMessage] = useState("Preparing the secure study runner…");

  useEffect(() => {
    let cancelled = false;

    async function exchangeHandoff() {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const handoffToken = fragment.get("token") || "";
      window.history.replaceState(null, "", window.location.pathname);

      if (!handoffToken) {
        setMessage("This mobile handoff is not valid. Return to the PsyLattice app and try again.");
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        "psylattice_exchange_mobile_web_handoff",
        { p_handoff_token: handoffToken }
      );
      const result = data as HandoffResult | null;

      if (
        cancelled ||
        error ||
        !result?.ok ||
        !result.link_token ||
        !result.session_token
      ) {
        if (!cancelled) {
          setMessage("This mobile handoff has expired or was already used. Return to the app and try again.");
        }
        return;
      }

      window.localStorage.setItem(
        `psylattice-study-${result.link_token}`,
        result.session_token
      );
      window.location.replace(`/study/${encodeURIComponent(result.link_token)}`);
    }

    void exchangeHandoff();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f6fbfc] px-5 py-8 text-slate-950">
      <div className="mx-auto max-w-lg rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_20px_55px_rgba(15,23,42,0.10)]">
        <PsyLatticeLogo />
        <h1 className="mt-8 text-2xl font-semibold">Secure participant handoff</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600" role="status">
          {message}
        </p>
      </div>
    </main>
  );
}
