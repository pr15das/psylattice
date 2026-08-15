"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";

type MessageThread = {
  connection_id: string;
  peer_id: string;
  peer_name: string;
  my_role: "clinician" | "client";
  connection_status: string;
  connected_at: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

type SecureMessage = {
  id: string;
  connection_id: string;
  sender_id: string;
  sender_role: "clinician" | "client";
  body: string;
  created_at: string;
  read_at: string | null;
  is_mine: boolean;
};

type FixedThread = {
  connection_id: string;
  peer_id: string;
  peer_name: string;
};

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "PL"
  );
}

function compactTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();

  if (
    date.toDateString() ===
    today.toDateString()
  ) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function fullTime(value: string) {
  const date = new Date(value);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayLabel(value: string) {
  const date = new Date(value);
  const now = new Date();

  const yesterday = new Date(now);
  yesterday.setDate(
    yesterday.getDate() - 1
  );

  if (
    date.toDateString() ===
    now.toDateString()
  ) {
    return "Today";
  }

  if (
    date.toDateString() ===
    yesterday.toDateString()
  ) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() ===
      now.getFullYear()
        ? undefined
        : "numeric",
  });
}

function sameDay(
  a: string,
  b: string
) {
  return (
    new Date(a).toDateString() ===
    new Date(b).toDateString()
  );
}

export function MessageUnreadBadge({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [count, setCount] =
    useState(0);

  async function refreshUnreadCount() {
    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_message_unread_count"
      );

    if (error) {
      console.error(
        "Could not load unread message count:",
        error
      );
      return;
    }

    setCount(
      Number(data || 0)
    );
  }

  useEffect(() => {
    void refreshUnreadCount();

    const supabase = createClient();

    const channel = supabase
      .channel(
        `psylattice-global-message-badge-${Math.random()}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clinical_messages",
        },
        () => {
          void refreshUnreadCount();
        }
      )
      .subscribe();

    function refreshOnFocus() {
      void refreshUnreadCount();
    }

    window.addEventListener(
      "focus",
      refreshOnFocus
    );

    return () => {
      void supabase.removeChannel(
        channel
      );
      window.removeEventListener(
        "focus",
        refreshOnFocus
      );
    };
  }, []);

  if (count < 1) {
    return null;
  }

  if (compact) {
    return (
      <span
        title={`${count} unread message${
          count === 1 ? "" : "s"
        }`}
        className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-cyan-700 px-1 text-[9px] font-bold text-white"
      >
        {count > 9 ? "9+" : count}
      </span>
    );
  }

  return (
    <span className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-cyan-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function PsyLatticeMessagesWorkspace({
  mode,
  fixedThread,
}: {
  mode: "clinician" | "client";
  fixedThread?: FixedThread;
}) {
  const [threads, setThreads] =
    useState<MessageThread[]>([]);
  const [
    selectedConnectionId,
    setSelectedConnectionId,
  ] = useState(
    fixedThread?.connection_id || ""
  );
  const [messages, setMessages] =
    useState<SecureMessage[]>([]);
  const [loadingThreads, setLoadingThreads] =
    useState(mode === "client");
  const [loadingMessages, setLoadingMessages] =
    useState(false);
  const [sending, setSending] =
    useState(false);
  const [draft, setDraft] =
    useState("");
  const [
    emailNotificationsEnabled,
    setEmailNotificationsEnabled,
  ] = useState(true);
  const [
    messageNotificationEmail,
    setMessageNotificationEmail,
  ] = useState("");
  const [
    notificationPreferenceLoading,
    setNotificationPreferenceLoading,
  ] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [threadPanelOpen, setThreadPanelOpen] =
    useState(true);

  const messageEndRef =
    useRef<HTMLDivElement | null>(null);
  const composerRef =
    useRef<HTMLTextAreaElement | null>(
      null
    );

  const selectedThread = useMemo(() => {
    if (fixedThread) {
      return {
        connection_id:
          fixedThread.connection_id,
        peer_id: fixedThread.peer_id,
        peer_name: fixedThread.peer_name,
        my_role: mode,
        connection_status: "active",
        connected_at: "",
        last_message: null,
        last_message_at: null,
        unread_count: 0,
      } satisfies MessageThread;
    }

    return (
      threads.find(
        (thread) =>
          thread.connection_id ===
          selectedConnectionId
      ) || null
    );
  }, [
    fixedThread,
    mode,
    threads,
    selectedConnectionId,
  ]);

  function scrollToBottom(
    behavior: ScrollBehavior = "smooth"
  ) {
    window.requestAnimationFrame(() => {
      messageEndRef.current?.scrollIntoView({
        behavior,
        block: "end",
      });
    });
  }

  async function loadMessageNotificationPreference() {
    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_my_message_notification_preference"
      );

    if (error) {
      console.error(
        "Could not load message email preference:",
        error
      );
      setNotificationPreferenceLoading(false);
      return;
    }

    const result =
      (data || {}) as {
        enabled?: boolean;
        email?: string | null;
      };

    setEmailNotificationsEnabled(
      result.enabled !== false
    );
    setMessageNotificationEmail(
      result.email || ""
    );
    setNotificationPreferenceLoading(false);
  }

  async function toggleMessageEmailNotifications() {
    const next =
      !emailNotificationsEnabled;

    setNotificationPreferenceLoading(true);

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_set_my_message_email_notifications",
        {
          p_enabled: next,
        }
      );

    if (error) {
      console.error(
        "Could not change message email notifications:",
        error
      );
      setErrorMessage(
        error.message ||
          "Message email notification preference could not be changed."
      );
      setNotificationPreferenceLoading(false);
      return;
    }

    const result =
      (data || {}) as {
        enabled?: boolean;
        email?: string | null;
      };

    setEmailNotificationsEnabled(
      result.enabled !== false
    );
    setMessageNotificationEmail(
      result.email || ""
    );
    setNotificationPreferenceLoading(false);
  }

  async function requestMessageEmailNotification(
    messageId: string
  ) {
    try {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return;
      }

      const response = await fetch(
        "/api/messages/notify",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messageId,
          }),
        }
      );

      if (!response.ok) {
        const result = await response
          .json()
          .catch(() => ({}));

        console.warn(
          "Message was sent, but email notification could not be delivered:",
          result
        );
      }
    } catch (notificationError) {
      console.warn(
        "Message was sent, but email notification request failed:",
        notificationError
      );
    }
  }

  async function loadThreads(
    preserveSelection = true
  ) {
    if (fixedThread) {
      return;
    }

    setLoadingThreads(true);
    setErrorMessage("");

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_message_threads"
      );

    if (error) {
      console.error(
        "Could not load message threads:",
        error
      );
      setErrorMessage(
        error.message ||
          "Your message conversations could not be loaded."
      );
      setThreads([]);
      setLoadingThreads(false);
      return;
    }

    let rows = (
      (data || []) as MessageThread[]
    ).map((row) => ({
      ...row,
      unread_count: Number(
        row.unread_count || 0
      ),
    }));

    if (mode === "client") {
      rows = [...rows].sort(
        (a, b) =>
          new Date(
            b.connected_at
          ).getTime() -
          new Date(
            a.connected_at
          ).getTime()
      );

      // A Self user has one current clinician conversation.
      // Legacy/test databases may contain older active connections,
      // so only the newest active connection is exposed in the client UI.
      rows = rows.slice(0, 1);
    }

    setThreads(rows);

    if (
      !preserveSelection ||
      !rows.some(
        (row) =>
          row.connection_id ===
          selectedConnectionId
      )
    ) {
      setSelectedConnectionId(
        rows[0]?.connection_id || ""
      );
    }

    setLoadingThreads(false);
  }

  async function markRead(
    connectionId: string
  ) {
    if (!connectionId) {
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "psylattice_mark_messages_read",
      {
        p_connection_id:
          connectionId,
      }
    );

    if (error) {
      console.error(
        "Could not mark messages read:",
        error
      );
      return;
    }

    setMessages((current) =>
      current.map((message) =>
        !message.is_mine &&
        !message.read_at
          ? {
              ...message,
              read_at:
                new Date().toISOString(),
            }
          : message
      )
    );

    setThreads((current) =>
      current.map((thread) =>
        thread.connection_id ===
        connectionId
          ? {
              ...thread,
              unread_count: 0,
            }
          : thread
      )
    );
  }

  async function loadMessages(
    connectionId: string,
    options?: {
      quiet?: boolean;
      scroll?: boolean;
    }
  ) {
    if (!connectionId) {
      setMessages([]);
      return;
    }

    if (!options?.quiet) {
      setLoadingMessages(true);
    }

    setErrorMessage("");

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_messages_for_connection",
        {
          p_connection_id:
            connectionId,
          p_limit: 300,
        }
      );

    if (error) {
      console.error(
        "Could not load messages:",
        error
      );
      setErrorMessage(
        error.message ||
          "This conversation could not be loaded."
      );
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setMessages(
      (data || []) as SecureMessage[]
    );
    setLoadingMessages(false);

    await markRead(connectionId);

    if (options?.scroll !== false) {
      scrollToBottom(
        options?.quiet
          ? "smooth"
          : "auto"
      );
    }
  }

  useEffect(() => {
    void loadMessageNotificationPreference();
  }, []);

  useEffect(() => {
    if (!fixedThread) {
      void loadThreads(false);
    }
  }, [mode, fixedThread?.connection_id]);

  useEffect(() => {
    if (fixedThread?.connection_id) {
      setSelectedConnectionId(
        fixedThread.connection_id
      );
    }
  }, [
    fixedThread?.connection_id,
  ]);

  useEffect(() => {
    if (!selectedConnectionId) {
      setMessages([]);
      return;
    }

    void loadMessages(
      selectedConnectionId
    );
  }, [selectedConnectionId]);

  useEffect(() => {
    if (!selectedConnectionId) {
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel(
        `psylattice-messages-${selectedConnectionId}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clinical_messages",
          filter: `connection_id=eq.${selectedConnectionId}`,
        },
        () => {
          void loadMessages(
            selectedConnectionId,
            {
              quiet: true,
              scroll: true,
            }
          );

          if (!fixedThread) {
            void loadThreads(true);
          }
        }
      )
      .subscribe();

    function refreshOnFocus() {
      void loadMessages(
        selectedConnectionId,
        {
          quiet: true,
          scroll: false,
        }
      );

      if (!fixedThread) {
        void loadThreads(true);
      }
    }

    function refreshWhenVisible() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        refreshOnFocus();
      }
    }

    window.addEventListener(
      "focus",
      refreshOnFocus
    );
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener(
        "focus",
        refreshOnFocus
      );
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, [
    selectedConnectionId,
    mode,
  ]);

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages.length]);

  async function sendMessage() {
    const body = draft.trim();

    if (
      sending ||
      !body ||
      !selectedConnectionId
    ) {
      return;
    }

    setSending(true);
    setErrorMessage("");

    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_send_message",
        {
          p_connection_id:
            selectedConnectionId,
          p_body: body,
        }
      );

    if (error) {
      console.error(
        "Could not send message:",
        error
      );
      setErrorMessage(
        error.message ||
          "Your message could not be sent."
      );
      setSending(false);
      return;
    }

    const created = Array.isArray(data)
      ? (data[0] as
          | SecureMessage
          | undefined)
      : undefined;

    if (created) {
      setMessages((current) => {
        if (
          current.some(
            (message) =>
              message.id ===
              created.id
          )
        ) {
          return current;
        }

        return [...current, created];
      });

      void requestMessageEmailNotification(
        created.id
      );
    }

    setDraft("");
    setSending(false);
    scrollToBottom();

    if (!fixedThread) {
      void loadThreads(true);
    }

    window.setTimeout(() => {
      composerRef.current?.focus();
    }, 0);
  }

  function handleComposerKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      void sendMessage();
    }
  }

  const unreadTotal = threads.reduce(
    (sum, thread) =>
      sum + thread.unread_count,
    0
  );

  const showThreadPanel =
    mode === "clinician" &&
    !fixedThread &&
    threadPanelOpen;

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-45px_rgba(15,23,42,0.35)]">
      <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50/80 via-white to-slate-50/60 px-5 py-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-sm">
              ✦
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-950">
                  Secure Messages
                </h2>

                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                  Live
                </span>

                {unreadTotal > 0 && (
                    <span className="rounded-full bg-cyan-800 px-2.5 py-1 text-[10px] font-semibold text-white">
                      {unreadTotal} unread
                    </span>
                  )}
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {mode === "clinician"
                  ? "Your secure client inbox for non-urgent clinical communication."
                  : "Your private PsyLattice conversation with your current clinician."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {mode === "clinician" &&
              !fixedThread && (
                <button
                  type="button"
                  onClick={() =>
                    setThreadPanelOpen(
                      (current) =>
                        !current
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {threadPanelOpen
                    ? "⇤ Focus conversation"
                    : "☰ Clients"}
                </button>
              )}

            <button
              type="button"
              disabled={
                notificationPreferenceLoading
              }
              onClick={() =>
                void toggleMessageEmailNotifications()
              }
              title={
                messageNotificationEmail
                  ? `Message notifications: ${messageNotificationEmail}`
                  : "Message email notifications"
              }
              className={`rounded-xl border px-3 py-2 text-[10px] font-semibold transition disabled:opacity-50 ${
                emailNotificationsEnabled
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {notificationPreferenceLoading
                ? "Email alerts…"
                : emailNotificationsEnabled
                  ? "✉ Email alerts on"
                  : "✉ Email alerts off"}
            </button>

            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[10px] font-medium text-amber-800">
              Not for urgent or emergency support
            </div>
          </div>
        </div>
      </div>

      <div
        className={`grid min-h-[680px] ${
          showThreadPanel
            ? "lg:grid-cols-[290px_minmax(0,1fr)]"
            : "grid-cols-1"
        }`}
      >
        {showThreadPanel && (
          <aside className="border-b border-slate-100 bg-slate-50/55 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-100 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Client conversations
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Choose a connected client to open their secure conversation.
              </p>
            </div>

            <div className="max-h-[590px] space-y-2 overflow-y-auto p-3">
              {loadingThreads ? (
                <div className="rounded-2xl bg-white p-5 text-center text-xs text-slate-400">
                  Loading conversations...
                </div>
              ) : threads.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No client conversations
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Secure messaging becomes available when a client is actively connected to your Clinical workspace.
                  </p>
                </div>
              ) : (
                threads.map((thread) => {
                  const selected =
                    thread.connection_id ===
                    selectedConnectionId;

                  return (
                    <button
                      key={
                        thread.connection_id
                      }
                      type="button"
                      onClick={() =>
                        setSelectedConnectionId(
                          thread.connection_id
                        )
                      }
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        selected
                          ? "border-cyan-200 bg-cyan-50 shadow-sm"
                          : "border-transparent bg-white hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                          {initials(
                            thread.peer_name
                          )}

                          {thread.unread_count >
                            0 && (
                            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-cyan-700 px-1 text-[9px] font-semibold text-white">
                              {
                                thread.unread_count
                              }
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {
                                thread.peer_name
                              }
                            </p>

                            <span className="shrink-0 text-[9px] text-slate-400">
                              {compactTime(
                                thread.last_message_at
                              )}
                            </span>
                          </div>

                          <p
                            className={`mt-1 truncate text-[11px] ${
                              thread.unread_count >
                              0
                                ? "font-semibold text-slate-700"
                                : "text-slate-400"
                            }`}
                          >
                            {thread.last_message ||
                              "Start a secure conversation"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        )}

        <section className="flex min-w-0 flex-col bg-white">
          {!selectedThread ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-xl text-cyan-800">
                  ✉
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {mode === "clinician"
                    ? "Choose a client"
                    : "No active clinician"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {mode === "clinician"
                    ? "Select a connected client from the conversation list to begin secure messaging."
                    : "Secure messaging will appear here when you have an active clinician connection."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-sm font-semibold text-cyan-900">
                    {initials(
                      selectedThread.peer_name
                    )}
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {
                        selectedThread.peer_name
                      }
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Connected through PsyLattice
                      {" · "}
                      New messages appear automatically
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-[10px] leading-4 text-cyan-900">
                  Messaging does not change your assessment or monitoring sharing permissions.
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto bg-[linear-gradient(to_bottom,#ffffff,#fbfdfe)] px-4 py-5 sm:px-6">
                  {errorMessage && (
                    <div className="mx-auto mb-4 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                      {errorMessage}
                    </div>
                  )}

                  {loadingMessages ? (
                    <div className="flex min-h-[380px] items-center justify-center">
                      <p className="text-sm text-slate-400">
                        Loading conversation...
                      </p>
                    </div>
                  ) : messages.length ===
                    0 ? (
                    <div className="flex min-h-[380px] items-center justify-center">
                      <div className="max-w-md text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-cyan-100 bg-cyan-50 text-2xl text-cyan-800">
                          ✦
                        </div>

                        <h3 className="mt-4 text-lg font-semibold text-slate-900">
                          Start the conversation
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Use this space for secure, non-urgent communication related to care, appointments, assessments or monitoring.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mx-auto max-w-3xl space-y-2">
                      {messages.map(
                        (
                          message,
                          index
                        ) => {
                          const previous =
                            messages[
                              index - 1
                            ];

                          const showDay =
                            !previous ||
                            !sameDay(
                              previous.created_at,
                              message.created_at
                            );

                          const previousSameSender =
                            previous &&
                            previous.is_mine ===
                              message.is_mine &&
                            !showDay;

                          return (
                            <div
                              key={message.id}
                            >
                              {showDay && (
                                <div className="my-5 flex items-center gap-3">
                                  <div className="h-px flex-1 bg-slate-100" />
                                  <span className="rounded-full border border-slate-100 bg-white px-3 py-1 text-[10px] font-medium text-slate-400">
                                    {dayLabel(
                                      message.created_at
                                    )}
                                  </span>
                                  <div className="h-px flex-1 bg-slate-100" />
                                </div>
                              )}

                              <div
                                className={`flex ${
                                  message.is_mine
                                    ? "justify-end"
                                    : "justify-start"
                                } ${
                                  previousSameSender
                                    ? "mt-1"
                                    : "mt-3"
                                }`}
                              >
                                <div
                                  className={`max-w-[86%] sm:max-w-[72%] ${
                                    message.is_mine
                                      ? "items-end"
                                      : "items-start"
                                  } flex flex-col`}
                                >
                                  <div
                                    className={`whitespace-pre-wrap break-words px-4 py-3 text-sm leading-6 ${
                                      message.is_mine
                                        ? "rounded-[20px] rounded-br-md bg-slate-950 text-white shadow-sm"
                                        : "rounded-[20px] rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.4)]"
                                    }`}
                                  >
                                    {
                                      message.body
                                    }
                                  </div>

                                  <div
                                    className={`mt-1 flex items-center gap-1.5 px-1 text-[9px] ${
                                      message.is_mine
                                        ? "text-slate-400"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    <span>
                                      {fullTime(
                                        message.created_at
                                      )}
                                    </span>

                                    {message.is_mine && (
                                      <>
                                        <span>
                                          ·
                                        </span>
                                        <span>
                                          {message.read_at
                                            ? "Read"
                                            : "Sent"}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}

                      <div
                        ref={messageEndRef}
                      />
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 bg-white p-4 sm:p-5">
                  <div className="mx-auto max-w-3xl">
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50/60 p-2 transition focus-within:border-cyan-300 focus-within:bg-white focus-within:shadow-[0_14px_34px_-24px_rgba(8,145,178,0.35)]">
                      <textarea
                        ref={composerRef}
                        value={draft}
                        disabled={
                          sending ||
                          selectedThread.connection_status !==
                            "active"
                        }
                        onChange={(event) =>
                          setDraft(
                            event.target.value.slice(
                              0,
                              4000
                            )
                          )
                        }
                        onKeyDown={
                          handleComposerKeyDown
                        }
                        rows={2}
                        placeholder={
                          mode === "clinician"
                            ? `Message ${selectedThread.peer_name}…`
                            : `Message ${selectedThread.peer_name}…`
                        }
                        className="max-h-36 min-h-[58px] w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
                      />

                      <div className="flex flex-col justify-between gap-2 border-t border-slate-200/70 px-2 pt-2 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
                            Enter to send · Shift + Enter for a new line
                          </span>

                          {draft.length >
                            3600 && (
                            <span
                              className={`text-[10px] font-semibold ${
                                draft.length >
                                3950
                                  ? "text-red-600"
                                  : "text-amber-600"
                              }`}
                            >
                              {draft.length}
                              /4000
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={
                            sending ||
                            !draft.trim() ||
                            !selectedConnectionId
                          }
                          onClick={() =>
                            void sendMessage()
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-800 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {sending
                            ? "Sending…"
                            : "Send message"}
                          <span aria-hidden="true">
                            ↗
                          </span>
                        </button>
                      </div>
                    </div>

                    <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
                      Keep urgent or emergency concerns outside this asynchronous messaging channel and use the appropriate local emergency or crisis service.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
