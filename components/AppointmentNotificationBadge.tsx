"use client";

import {
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

export default function AppointmentNotificationBadge({
  mode,
  compact = false,
}: {
  mode: "clinician" | "client";
  compact?: boolean;
}) {
  const [count, setCount] =
    useState(0);

  async function refreshCount() {
    const supabase = createClient();

    const { data, error } =
      await supabase.rpc(
        "psylattice_appointment_notification_count",
        {
          p_scope: mode,
        }
      );

    if (error) {
      console.error(
        "Could not load appointment notification count:",
        error
      );
      return;
    }

    setCount(Number(data || 0));
  }

  useEffect(() => {
    void refreshCount();

    const supabase = createClient();

    const channel = supabase
      .channel(
        `appointment-notifications-${mode}-${Math.random()}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table:
            "psylattice_appointment_notifications",
        },
        () => {
          void refreshCount();
        }
      )
      .subscribe();

    function refreshOnFocus() {
      void refreshCount();
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
  }, [mode]);

  if (count < 1) {
    return null;
  }

  if (compact) {
    return (
      <span
        title={`${count} new appointment notification${
          count === 1 ? "" : "s"
        }`}
        className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-cyan-700 px-1 text-[9px] font-bold text-white"
      >
        {count > 9 ? "9+" : count}
      </span>
    );
  }

  return (
    <span
      title={`${count} new appointment notification${
        count === 1 ? "" : "s"
      }`}
      className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-cyan-700 px-1.5 py-0.5 text-[10px] font-bold text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
