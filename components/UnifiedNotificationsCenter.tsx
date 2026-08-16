"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

export type UnifiedNotificationWorkspace =
  | "self"
  | "clinician"
  | "researcher";

export type UnifiedNotificationTargetParams = Record<
  string,
  unknown
>;

type UnifiedNotification = {
  notification_id: string;
  workspace: UnifiedNotificationWorkspace;
  kind: string;
  actor_id: string | null;
  actor_name: string;
  connection_id: string | null;
  source_table: string;
  source_id: string;
  title: string;
  body: string;
  target_screen: string;
  target_params: UnifiedNotificationTargetParams;
  created_at: string;
  read_at: string | null;
};

type NotificationFilter = "all" | "unread";

function compactCount(count: number) {
  if (count > 99) return "99+";
  return String(count);
}

function relativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - date.getTime());
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year:
      date.getFullYear() === new Date().getFullYear()
        ? undefined
        : "numeric",
  });
}

function kindMeta(kind: string) {
  switch (kind) {
    case "secure_message":
      return {
        label: "Message",
        glyph: "M",
        tone: "bg-violet-50 text-violet-700 border-violet-100",
      };

    case "appointment_request":
    case "appointment_scheduled":
    case "request_rejected":
    case "request_cancelled":
      return {
        label: "Appointment",
        glyph: "A",
        tone: "bg-cyan-50 text-cyan-800 border-cyan-100",
      };

    case "assessment_assignment":
    case "assessment_completed":
      return {
        label: "Assessment",
        glyph: "Q",
        tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
      };

    case "monitoring_request":
    case "monitoring_accepted":
    case "monitoring_declined":
      return {
        label: "Monitoring",
        glyph: "D",
        tone: "bg-amber-50 text-amber-800 border-amber-100",
      };

    case "clinician_invitation":
      return {
        label: "Clinician",
        glyph: "C",
        tone: "bg-sky-50 text-sky-800 border-sky-100",
      };

    default:
      return {
        label: "Update",
        glyph: "•",
        tone: "bg-slate-50 text-slate-700 border-slate-200",
      };
  }
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M18 9.8c0-3.4-2-5.8-6-5.8s-6 2.4-6 5.8c0 6-2.5 6.7-2.5 6.7h17S18 15.8 18 9.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 19c.5.7 1.3 1 2.5 1s2-.3 2.5-1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UnifiedNotificationBadge({
  workspace,
  compact = false,
}: {
  workspace: UnifiedNotificationWorkspace;
  compact?: boolean;
}) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_notification_unread_count",
      {
        p_workspace: workspace,
      }
    );

    if (error) {
      console.error(
        "Could not load unified notification count:",
        error
      );
      return;
    }

    setCount(Number(data || 0));
  }, [workspace]);

  useEffect(() => {
    void refresh();

    const supabase = createClient();

    const channel = supabase
      .channel(
        `psylattice-notification-badge-${workspace}-${Math.random()}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "psylattice_notifications",
          filter: `workspace=eq.${workspace}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    const timer = window.setInterval(() => {
      void refresh();
    }, 15_000);

    function refreshOnFocus() {
      void refresh();
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, [refresh, workspace]);

  if (count < 1) {
    return null;
  }

  if (compact) {
    return (
      <span
        title={`${count} unread notification${count === 1 ? "" : "s"}`}
        className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-cyan-700 px-1 text-[9px] font-bold text-white"
      >
        {compactCount(count)}
      </span>
    );
  }

  return (
    <span className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-cyan-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
      {compactCount(count)}
    </span>
  );
}

export function UnifiedNotificationBell({
  workspace,
  onClick,
}: {
  workspace: UnifiedNotificationWorkspace;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open notifications"
      title="Notifications"
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-900"
    >
      <BellIcon />
      <UnifiedNotificationBadge
        workspace={workspace}
        compact
      />
    </button>
  );
}

export default function UnifiedNotificationsCenter({
  workspace,
  onNavigate,
}: {
  workspace: UnifiedNotificationWorkspace;
  onNavigate?: (
    targetScreen: string,
    targetParams: UnifiedNotificationTargetParams
  ) => void | Promise<void>;
}) {
  const [notifications, setNotifications] = useState<
    UnifiedNotification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] =
    useState<NotificationFilter>("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(
    null
  );

  const loadNotifications = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      }

      setError("");
      const supabase = createClient();

      if (workspace === "self") {
        const { error: syncError } = await supabase.rpc(
          "psylattice_sync_my_clinician_invitation_notifications"
        );

        if (syncError) {
          console.error(
            "Could not sync clinician invitation notifications:",
            syncError
          );
        }
      }

      const { data, error: loadError } = await supabase.rpc(
        "psylattice_my_notifications",
        {
          p_workspace: workspace,
          p_limit: 100,
        }
      );

      if (loadError) {
        console.error(
          "Could not load unified notifications:",
          loadError
        );
        setError(
          "Notifications could not be loaded. Please try again."
        );
        setLoading(false);
        return;
      }

      setNotifications(
        (data || []) as UnifiedNotification[]
      );
      setLoading(false);
    },
    [workspace]
  );

  useEffect(() => {
    void loadNotifications(true);

    const supabase = createClient();

    const channel = supabase
      .channel(
        `psylattice-notification-center-${workspace}-${Math.random()}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "psylattice_notifications",
          filter: `workspace=eq.${workspace}`,
        },
        () => {
          void loadNotifications(false);
        }
      )
      .subscribe();

    const timer = window.setInterval(() => {
      void loadNotifications(false);
    }, 15_000);

    function refreshOnFocus() {
      void loadNotifications(false);
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadNotifications(false);
      }
    }

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, [loadNotifications, workspace]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.read_at
      ).length,
    [notifications]
  );

  const visibleNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter(
        (notification) => !notification.read_at
      );
    }

    return notifications;
  }, [filter, notifications]);

  async function markRead(notificationId: string) {
    const supabase = createClient();

    const { error: markError } = await supabase.rpc(
      "psylattice_mark_notification_read",
      {
        p_notification_id: notificationId,
      }
    );

    if (markError) {
      console.error(
        "Could not mark notification read:",
        markError
      );
      return false;
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.notification_id === notificationId
          ? {
              ...notification,
              read_at:
                notification.read_at ||
                new Date().toISOString(),
            }
          : notification
      )
    );

    return true;
  }

  async function markAllRead() {
    if (markingAll || unreadCount < 1) return;

    setMarkingAll(true);
    setError("");

    const supabase = createClient();
    const { error: markError } = await supabase.rpc(
      "psylattice_mark_workspace_notifications_read",
      {
        p_workspace: workspace,
      }
    );

    if (markError) {
      console.error(
        "Could not mark notifications read:",
        markError
      );
      setError(
        "Notifications could not be marked as read. Please try again."
      );
      setMarkingAll(false);
      return;
    }

    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read_at: notification.read_at || readAt,
      }))
    );
    setMarkingAll(false);
  }

  async function openNotification(
    notification: UnifiedNotification
  ) {
    if (openingId) return;

    setOpeningId(notification.notification_id);
    setError("");

    if (!notification.read_at) {
      await markRead(notification.notification_id);
    }

    if (onNavigate) {
      await onNavigate(
        notification.target_screen,
        notification.target_params || {}
      );
    }

    setOpeningId(null);
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50/70 via-white to-white px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-800">
                  <BellIcon />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-800">
                    Notifications
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                    Your PsyLattice updates
                  </h2>
                </div>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                One place for actionable updates across secure messages,
                appointments, assessments and monitoring. Sensitive message
                text, assessment answers and monitoring responses are not
                copied into notifications.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={markingAll || unreadCount < 1}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-default disabled:opacity-45"
            >
              {markingAll ? "Marking..." : "Mark all read"}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(
                [
                  ["all", "All"],
                  ["unread", `Unread${unreadCount ? ` (${unreadCount})` : ""}`],
                ] as Array<[NotificationFilter, string]>
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    filter === id
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void loadNotifications(true)}
              className="text-xs font-semibold text-cyan-800 transition hover:text-cyan-950"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              Loading notifications...
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-10 text-center">
              <p className="font-semibold text-slate-800">
                {filter === "unread"
                  ? "You are all caught up"
                  : "No notifications yet"}
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {filter === "unread"
                  ? "There are no unread updates in this workspace."
                  : "New actionable updates will appear here as your PsyLattice workflow develops."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
              {visibleNotifications.map((notification) => {
                const meta = kindMeta(notification.kind);
                const unread = !notification.read_at;
                const isOpening =
                  openingId === notification.notification_id;

                return (
                  <button
                    key={notification.notification_id}
                    type="button"
                    onClick={() =>
                      void openNotification(notification)
                    }
                    disabled={Boolean(openingId)}
                    className={`group flex w-full items-start gap-4 px-4 py-4 text-left transition sm:px-5 ${
                      unread
                        ? "bg-cyan-50/35 hover:bg-cyan-50/60"
                        : "bg-white hover:bg-slate-50"
                    } disabled:cursor-wait`}
                  >
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${meta.tone}`}
                    >
                      {meta.glyph}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-950">
                          {notification.title}
                        </p>

                        {unread && (
                          <span className="h-2 w-2 rounded-full bg-cyan-700" />
                        )}

                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          {meta.label}
                        </span>
                      </div>

                      {notification.body && (
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {notification.body}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        {notification.actor_name && (
                          <span>{notification.actor_name}</span>
                        )}
                        <span>{relativeTime(notification.created_at)}</span>
                      </div>
                    </div>

                    <div className="mt-1 shrink-0 text-xs font-semibold text-cyan-800 opacity-70 transition group-hover:opacity-100">
                      {isOpening ? "Opening..." : "Open →"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <p className="px-1 text-xs leading-5 text-slate-400">
        Notifications are workflow alerts, not emergency monitoring. Secure
        clinical messaging should not be used for urgent or emergency care.
      </p>
    </div>
  );
}
