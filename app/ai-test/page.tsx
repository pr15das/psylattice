"use client";

import { useState } from "react";

export default function AITestPage() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage() {
    if (!message.trim() || loading) return;

    setLoading(true);
    setError("");
    setReply("");

    try {
      const response = await fetch("/api/ai-guide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed.");
      }

      setReply(data.reply);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold">
          PsyLattice AI Test
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Temporary page for testing the AI Guide connection.
        </p>

        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          placeholder="Type a message..."
          className="mt-8 min-h-32 w-full rounded-2xl border border-slate-200 bg-white p-4 outline-none focus:border-cyan-600"
        />

        <button
          onClick={sendMessage}
          disabled={loading || !message.trim()}
          className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Send to Luna"}
        </button>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {reply && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
              Luna response
            </p>

            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
              {reply}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}