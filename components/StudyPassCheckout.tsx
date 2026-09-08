"use client";

import { useState } from "react";

declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void }; } }

function loadCheckoutScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay Checkout could not be loaded."));
    document.body.appendChild(script);
  });
}

export default function StudyPassCheckout({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function startCheckout() {
    if (busy) return;
    setBusy(true); setStatus("Preparing checkout...");
    try {
      const response = await fetch("/api/billing/razorpay/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_code: "study_pass" }) });
      const order = await response.json() as { ok?: boolean; error?: string; order_id?: string; amount?: number; currency?: string; key_id?: string; product_name?: string };
      if (!response.ok || !order.ok || !order.order_id || !order.key_id) throw new Error(order.error || "Checkout could not be prepared.");
      await loadCheckoutScript();
      if (!window.Razorpay) throw new Error("Razorpay Checkout is unavailable.");
      const checkout = new window.Razorpay({ key: order.key_id, amount: order.amount, currency: order.currency, name: "PsyLattice", description: order.product_name, order_id: order.order_id, handler: async (result: Record<string, string>) => {
        const verifyResponse = await fetch("/api/billing/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...result, product_code: "study_pass" }) });
        const verified = await verifyResponse.json() as { success?: boolean; error?: string };
        setStatus(verifyResponse.ok && verified.success ? "Payment verified successfully. Study Pass payment verified in Test Mode." : (verified.error || "Payment verification failed."));
        setBusy(false);
      }, modal: { ondismiss: () => { setStatus("Checkout was dismissed."); setBusy(false); } } });
      checkout.open();
    } catch (checkoutError) { setStatus(checkoutError instanceof Error ? checkoutError.message : "Checkout could not be started."); setBusy(false); }
  }

  return <div className={className}><button type="button" onClick={() => void startCheckout()} disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60">{busy ? "Preparing checkout..." : "Get Study Pass"}</button>{status && <p className="mt-3 text-xs leading-5 text-slate-500" role="status">{status}</p>}</div>;
}
