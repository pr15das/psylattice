"use client";

import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
} from "lucide-react";

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-300/65 bg-white px-5 py-4 shadow-[0_5px_14px_rgba(15,23,42,0.055),0_20px_48px_rgba(15,23,42,0.085)]">
      <p className="text-[11px] font-medium tracking-[0.01em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.035em] text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-[12px] leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[24px] border border-slate-300/65 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.05),0_22px_54px_rgba(15,23,42,0.08)] ${className}`}
    >
      <div className="px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.012em] text-slate-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-4xl text-[13px] leading-5 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      <div className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6">{children}</div>
    </section>
  );
}

export function Status({
  children,
  type = "neutral",
}: {
  children: ReactNode;
  type?: "neutral" | "success" | "warning" | "accent";
}) {
  const styles = {
    neutral: {
      dot: "bg-slate-400",
      text: "text-slate-600",
      border: "border-slate-300/70",
    },
    success: {
      dot: "bg-cyan-500",
      text: "text-cyan-900",
      border: "border-cyan-300/70",
    },
    warning: {
      dot: "bg-violet-500",
      text: "text-violet-900",
      border: "border-violet-300/70",
    },
    accent: {
      dot: "bg-cyan-600",
      text: "text-slate-700",
      border: "border-cyan-200/80",
    },
  }[type];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border ${styles.border} bg-white px-2.5 py-1 text-[11px] font-medium ${styles.text} shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)]`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
      {children}
    </span>
  );
}

export function InlineFeedback({
  tone = "info",
  children,
  className = "",
}: {
  tone?: "info" | "success" | "warning" | "error";
  children: ReactNode;
  className?: string;
}) {
  const config = {
    info: {
      Icon: Info,
      icon: "text-cyan-700",
      line: "border-cyan-300",
    },
    success: {
      Icon: CheckCircle2,
      icon: "text-cyan-700",
      line: "border-cyan-300",
    },
    warning: {
      Icon: TriangleAlert,
      icon: "text-violet-600",
      line: "border-violet-300",
    },
    error: {
      Icon: AlertCircle,
      icon: "text-rose-600",
      line: "border-rose-300",
    },
  }[tone];

  const Icon = config.Icon;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 border-l-2 ${config.line} py-1 pl-3 text-[13px] leading-5 text-slate-600 ${className}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.icon}`} strokeWidth={1.8} aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
