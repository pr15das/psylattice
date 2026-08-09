"use client";

export default function DebugPage() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING";

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  const keyFingerprint = key
    ? `${key.slice(0, 18)}...${key.slice(-6)} (${key.length} chars)`
    : "MISSING";

  return (
    <main
      style={{
        padding: "40px",
        fontFamily: "monospace",
      }}
    >
      <h1>PsyLattice Supabase Debug</h1>

      <p>
        <strong>Supabase URL:</strong>
      </p>

      <pre>{url}</pre>

      <p>
        <strong>Publishable key fingerprint:</strong>
      </p>

      <pre>{keyFingerprint}</pre>
    </main>
  );
}