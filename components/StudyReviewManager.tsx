"use client";

import {
  Check,
  ChevronDown,
  CircleDot,
  ClipboardList,
  Clock3,
  Loader2,
  MessageSquareText,
  Plus,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type ReviewStatus = "open" | "resolved" | "dismissed";
type ReviewPriority = "normal" | "important" | "urgent";

type ReviewCard = {
  id: string;
  study_id: string;
  author_user_id: string;
  author_email: string;
  author_role: string;
  title: string;
  body: string;
  category: string;
  priority: ReviewPriority;
  status: ReviewStatus;
  source_screen: string | null;
  source_ref: string | null;
  source_label: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

type ReviewAccess = {
  accessType: "owner" | "collaborator" | null;
  role: string | null;
  studyTitle: string;
  isOwner: boolean;
};

type Props = {
  studyId: string;
  currentScreen?: string;
  triggerVariant?: "sidebar" | "inline";
  sourceRef?: string | null;
  sourceLabel?: string | null;
  defaultCategory?: string;
  buttonLabel?: string;
};

const CATEGORIES = [
  ["general", "General"],
  ["study_design", "Study design"],
  ["recruitment", "Recruitment"],
  ["participants", "Participants"],
  ["data", "Data"],
  ["analysis", "Analysis"],
  ["writing", "Writing"],
  ["study_health", "Study Health"],
  ["ethics", "Ethics"],
] as const;

function pretty(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function priorityClasses(priority: ReviewPriority) {
  if (priority === "urgent") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (priority === "important") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-500";
}

function statusClasses(status: ReviewStatus) {
  if (status === "resolved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "dismissed") {
    return "border-slate-200 bg-slate-100 text-slate-500";
  }
  return "border-cyan-200 bg-cyan-50 text-cyan-700";
}

export default function StudyReviewManager({
  studyId,
  currentScreen = "",
  triggerVariant = "sidebar",
  sourceRef = null,
  sourceLabel = null,
  defaultCategory = "general",
  buttonLabel = "Review Manager",
}: Props) {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<ReviewCard[]>([]);
  const [access, setAccess] = useState<ReviewAccess | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | ReviewStatus>("open");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [priority, setPriority] = useState<ReviewPriority>("normal");

  const loadReviews = useCallback(async () => {
    if (!studyId) {
      setReviews([]);
      setAccess(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/research/reviews?study_id=${encodeURIComponent(studyId)}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Reviews could not be loaded.");
      }

      setReviews(Array.isArray(payload.reviews) ? payload.reviews : []);
      setAccess(payload.access || null);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Reviews could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (open) void loadReviews();
  }, [open, loadReviews]);

  const openCount = reviews.filter((review) => review.status === "open").length;

  const visibleReviews = useMemo(() => {
    if (filter === "all") return reviews;
    return reviews.filter((review) => review.status === filter);
  }, [filter, reviews]);

  async function post(payload: Record<string, unknown>) {
    const response = await fetch("/api/research/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "The review update could not be completed.");
    }
    return data;
  }

  async function createReview(event: React.FormEvent) {
    event.preventDefault();
    if (!studyId || busy) return;

    setBusy("create");
    setError("");

    try {
      await post({
        operation: "create",
        studyId,
        title,
        body,
        category,
        priority,
        sourceScreen: currentScreen,
        sourceRef,
        sourceLabel,
      });

      setTitle("");
      setBody("");
      setCategory(defaultCategory);
      setPriority("normal");
      setFormOpen(false);
      setFilter("open");
      await loadReviews();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The review card could not be created.",
      );
    } finally {
      setBusy("");
    }
  }

  async function setStatus(reviewId: string, status: ReviewStatus) {
    if (!studyId || busy) return;

    setBusy(reviewId);
    setError("");

    try {
      await post({
        operation: "set_status",
        studyId,
        reviewId,
        status,
      });
      await loadReviews();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The review card could not be updated.",
      );
    } finally {
      setBusy("");
    }
  }

  const trigger =
    triggerVariant === "inline" ? (
      <button
        type="button"
        disabled={!studyId}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[9px] font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MessageSquareText className="h-3.5 w-3.5" />
        {buttonLabel}
        {openCount > 0 && (
          <span className="rounded-full bg-cyan-700 px-1.5 py-0.5 text-[7px] text-white">
            {openCount}
          </span>
        )}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-3 mb-3 flex w-[calc(100%-1.5rem)] items-center justify-between gap-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-left text-cyan-900 transition hover:border-cyan-300 hover:bg-cyan-100"
      >
        <span className="flex min-w-0 items-center gap-2">
          <MessageSquareText className="h-4 w-4 shrink-0" />
          <span className="text-[10px] font-semibold">{buttonLabel}</span>
        </span>
        {openCount > 0 ? (
          <span className="rounded-full bg-cyan-700 px-2 py-1 text-[7px] font-semibold text-white">
            {openCount}
          </span>
        ) : (
          <span className="text-[8px] text-cyan-600">Open</span>
        )}
      </button>
    );

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[9999]">
          <button
            type="button"
            aria-label="Close review manager"
            className="absolute inset-0 bg-slate-950/25 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute inset-y-0 right-0 flex w-full max-w-[500px] flex-col border-l border-slate-200 bg-white shadow-[-24px_0_70px_rgba(15,23,42,.14)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <ClipboardList className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-950">
                    Review Manager
                  </p>
                  <p className="mt-1 truncate text-[9px] text-slate-500">
                    {access?.studyTitle || "Collaborative study"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFilter("open")}
                  className={`rounded-xl border px-3 py-2 text-[8px] font-semibold ${
                    filter === "open"
                      ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  Open · {openCount}
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("resolved")}
                  className={`rounded-xl border px-3 py-2 text-[8px] font-semibold ${
                    filter === "resolved"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  Resolved · {reviews.filter((item) => item.status === "resolved").length}
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`rounded-xl border px-3 py-2 text-[8px] font-semibold ${
                    filter === "all"
                      ? "border-violet-200 bg-violet-50 text-violet-700"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  All · {reviews.length}
                </button>
              </div>
            </div>

            <div className="border-b border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setFormOpen((value) => !value)}
                className="flex w-full items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-left text-white"
              >
                <span className="flex items-center gap-2 text-[9px] font-semibold">
                  <Plus className="h-3.5 w-3.5" />
                  Create review card
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${formOpen ? "rotate-180" : ""}`}
                />
              </button>

              {formOpen && (
                <form onSubmit={createReview} className="mt-3 space-y-3">
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    maxLength={160}
                    placeholder="Short review title"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[10px] text-slate-800 outline-none focus:border-cyan-300"
                  />

                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    required
                    maxLength={6000}
                    rows={4}
                    placeholder="What should the researcher review, change or consider?"
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-[10px] leading-5 text-slate-800 outline-none focus:border-cyan-300"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <label className="relative">
                      <select
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-8 text-[9px] font-semibold text-slate-700 outline-none"
                      >
                        {CATEGORIES.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </label>

                    <label className="relative">
                      <select
                        value={priority}
                        onChange={(event) =>
                          setPriority(event.target.value as ReviewPriority)
                        }
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-8 text-[9px] font-semibold text-slate-700 outline-none"
                      >
                        <option value="normal">Normal</option>
                        <option value="important">Important</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[8px] leading-4 text-slate-400">
                      Visible to the study owner and every active collaborator.
                    </p>
                    <button
                      type="submit"
                      disabled={busy === "create"}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-cyan-700 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-50"
                    >
                      {busy === "create" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Create
                    </button>
                  </div>
                </form>
              )}

              {error && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[8px] leading-4 text-rose-700">
                  {error}
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {loading ? (
                <div className="flex min-h-[160px] items-center justify-center gap-2 text-[9px] text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading reviews…
                </div>
              ) : visibleReviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center">
                  <MessageSquareText className="mx-auto h-5 w-5 text-slate-300" />
                  <p className="mt-2 text-[9px] font-semibold text-slate-600">
                    No {filter === "all" ? "" : filter} review cards yet
                  </p>
                  <p className="mt-1 text-[8px] leading-4 text-slate-400">
                    Collaborators can leave structured notes for the researcher here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleReviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,.045)]"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                          <MessageSquareText className="h-3.5 w-3.5" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[7px] font-semibold ${statusClasses(
                                review.status,
                              )}`}
                            >
                              {pretty(review.status)}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[7px] font-semibold ${priorityClasses(
                                review.priority,
                              )}`}
                            >
                              {pretty(review.priority)}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[7px] font-semibold text-slate-500">
                              {CATEGORIES.find(([key]) => key === review.category)?.[1] ||
                                pretty(review.category)}
                            </span>
                          </div>

                          <h3 className="mt-2 text-[11px] font-semibold leading-5 text-slate-900">
                            {review.title}
                          </h3>
                          <p className="mt-1 whitespace-pre-wrap text-[9px] leading-5 text-slate-600">
                            {review.body}
                          </p>

                          {review.source_label && (
                            <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/55 px-2.5 py-2 text-[8px] font-semibold text-cyan-800">
                              {review.source_label}
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[7.5px] text-slate-400">
                            <span>
                              {review.author_email} · {pretty(review.author_role)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3 w-3" />
                              {shortDate(review.created_at)}
                            </span>
                            {review.source_screen && (
                              <span>From {pretty(review.source_screen)}</span>
                            )}
                          </div>

                          {access?.isOwner && (
                            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                              {review.status !== "resolved" && (
                                <button
                                  type="button"
                                  disabled={busy === review.id}
                                  onClick={() => void setStatus(review.id, "resolved")}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[7.5px] font-semibold text-emerald-700 disabled:opacity-45"
                                >
                                  <Check className="h-3 w-3" />
                                  Resolve
                                </button>
                              )}

                              {review.status !== "open" && (
                                <button
                                  type="button"
                                  disabled={busy === review.id}
                                  onClick={() => void setStatus(review.id, "open")}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-[7.5px] font-semibold text-cyan-700 disabled:opacity-45"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Reopen
                                </button>
                              )}

                              {review.status !== "dismissed" && (
                                <button
                                  type="button"
                                  disabled={busy === review.id}
                                  onClick={() => void setStatus(review.id, "dismissed")}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[7.5px] font-semibold text-slate-500 disabled:opacity-45"
                                >
                                  <X className="h-3 w-3" />
                                  Dismiss
                                </button>
                              )}

                              {busy === review.id && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" />
                <p className="text-[8px] leading-4 text-slate-500">
                  Review cards belong to this study, not to a collaborator's personal workspace. The owner controls resolution state; all active collaborators can contribute cards.
                </p>
              </div>
            </div>
          </aside>
        </div>,
        document.body,
      )
      : null;

  return (
    <>
      {trigger}
      {modal}
    </>
  );
}
