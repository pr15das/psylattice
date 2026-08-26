"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
} from "lucide-react";

const floatingPanelShadow =
  "shadow-[0_2px_5px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.075),0_32px_72px_rgba(15,23,42,0.055)]";
const floatingControlShadow =
  "shadow-[0_2px_4px_rgba(15,23,42,0.04),0_7px_18px_rgba(15,23,42,0.08)]";

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
    <div
      className={`rounded-[24px] border border-slate-300/75 bg-white px-5 py-4 ${floatingPanelShadow} transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200/80`}
    >
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" aria-hidden="true" />
        <p className="text-[11px] font-semibold tracking-[0.01em] text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-2 text-[27px] font-semibold leading-none tracking-[-0.035em] text-slate-950">
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
      className={`overflow-hidden rounded-[26px] border border-slate-300/75 bg-white ${floatingPanelShadow} ${className}`}
    >
      <div className="border-b border-slate-100/80 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <h2 className="text-[15px] font-semibold tracking-[-0.012em] text-slate-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-4xl text-[13px] leading-5 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6">{children}</div>
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
      text: "text-slate-650",
      border: "border-slate-300/75",
      bg: "bg-white",
    },
    success: {
      dot: "bg-cyan-500",
      text: "text-cyan-900",
      border: "border-cyan-300/75",
      bg: "bg-[#ecfbff]",
    },
    warning: {
      dot: "bg-violet-500",
      text: "text-violet-900",
      border: "border-violet-300/75",
      bg: "bg-[#f7f4ff]",
    },
    accent: {
      dot: "bg-cyan-600",
      text: "text-cyan-900",
      border: "border-cyan-200/90",
      bg: "bg-cyan-50/90",
    },
  }[type];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border ${styles.border} ${styles.bg} px-3.5 py-1.5 text-[11px] font-semibold ${styles.text} ${floatingControlShadow}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
      {children}
    </span>
  );
}

export function PillButton({
  children,
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "brand" | "danger" | "quiet";
}) {
  const variants = {
    primary:
      "border-slate-950 bg-slate-950 text-white shadow-[0_4px_10px_rgba(15,23,42,0.18),0_12px_26px_rgba(15,23,42,0.15)]",
    secondary:
      `border-slate-300/75 bg-white text-slate-700 ${floatingControlShadow}`,
    brand:
      "border-cyan-700 bg-cyan-800 text-white shadow-[0_4px_10px_rgba(8,145,178,0.2),0_12px_26px_rgba(8,145,178,0.16)]",
    danger:
      "border-rose-300/80 bg-white text-rose-700 shadow-[0_2px_4px_rgba(190,24,93,0.05),0_8px_20px_rgba(190,24,93,0.09)]",
    quiet:
      "border-transparent bg-transparent text-slate-600 shadow-none",
  }[variant];

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 ${variants} ${className}`}
    >
      {children}
    </button>
  );
}

export function FloatingSurface({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "review" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "border-slate-300/70 bg-white",
    brand: "border-cyan-200/80 bg-gradient-to-br from-white to-cyan-50/70",
    review: "border-violet-200/80 bg-gradient-to-br from-white to-violet-50/70",
    danger: "border-rose-200/80 bg-gradient-to-br from-white to-rose-50/40",
  }[tone];

  return (
    <div className={`rounded-[22px] border ${tones} p-4 ${floatingControlShadow} ${className}`}>
      {children}
    </div>
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
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${config.icon}`}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
