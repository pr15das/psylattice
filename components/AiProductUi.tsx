"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleHelp,
  Cpu,
  Crown,
  HardDrive,
  Info,
  LockKeyhole,
  Mail,
  Minus,
  PackagePlus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  UsersRound,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";

// Kept only as a compatibility export for older imports. The visible budget
// below is loaded from the authenticated billing endpoint and is no longer mock data.
export const AI_USAGE_MOCK = {
  usedPercentage: 0,
  remainingPercentage: 100,
};

export const AI_MODELS = [
  { name: "PsyLattice Auto", description: "PsyLattice default research routing.", impact: "Low", badge: "Recommended", active: true },
  { name: "OpenAI GPT", description: "Selectable OpenAI model path for paid research accounts.", impact: "High", badge: "", active: true },
  { name: "Claude", description: "Provider integration coming soon.", impact: "Medium", badge: "", active: false },
  { name: "Gemini Pro", description: "Provider integration coming soon.", impact: "Medium", badge: "", active: false },
  { name: "Gemini Flash", description: "Provider integration coming soon.", impact: "Low", badge: "", active: false },
  { name: "Gemini Flash Economy", description: "Google Gemini 3.5 Flash-Lite Free Tier. Lowest budget impact.", impact: "Lowest", badge: "Efficient", active: true },
] as const;

const AI_BUDGET_BOOST_CHOICES = [
  {
    id: "ai-starter",
    name: "Starter Boost",
    price: "₹99",
    detail: "A light top-up for a few more AI-assisted research tasks.",
  },
  {
    id: "ai-research",
    name: "Research Boost",
    price: "₹249",
    detail: "More headroom for active analysis, writing and study development.",
    badge: "Popular",
  },
  {
    id: "ai-power",
    name: "Power Boost",
    price: "₹499",
    detail: "The largest one-off boost for intensive AI-assisted work.",
  },
] as const;

type PlanBadgeApiResponse = {
  ok?: boolean;
  plan?: PlanTier;
  planName?: string;
  studyPassCount?: number;
};

type AiModelApiOption = {
  key: string;
  name: string;
  description: string;
  impact: string;
  allowed: boolean;
  available: boolean;
  badge?: string;
};

type AiModelApiResponse = {
  ok?: boolean;
  error?: string;
  selectedModel?: string;
  modelAccess?: "auto-only" | "selected" | "full";
  remainingPercent?: number;
  models?: AiModelApiOption[];
};

function clampBudgetPercent(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function useLiveAiBudget() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [allowanceLabel, setAllowanceLabel] = useState("AI allowance");
  const [canBuyAddons, setCanBuyAddons] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/billing/ai/model", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as AiModelApiResponse;
      if (!response.ok || !data.ok) return;

      const next = clampBudgetPercent(data.remainingPercent);
      setRemaining(next);
      setAllowanceLabel("AI allowance");
      setCanBuyAddons(data.modelAccess === "selected" || data.modelAccess === "full");
    } catch {
      // Keep the header usable if account status is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15_000);
    const onFocus = () => void refresh();
    const onBudgetRefresh = () => void refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("psylattice-ai-budget-refresh", onBudgetRefresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("psylattice-ai-budget-refresh", onBudgetRefresh);
    };
  }, [refresh]);

  return { remaining, allowanceLabel, canBuyAddons, refresh };
}

export function AiBudgetIndicator() {
  const { remaining, allowanceLabel, canBuyAddons } = useLiveAiBudget();
  const [open, setOpen] = useState(false);
  const display = remaining === null ? "—" : `${remaining}% left`;

  function chooseBoost(productId: string) {
    setOpen(false);
    const params = new URLSearchParams();
    params.set("screen", "billing");
    params.set("addToCart", productId);
    params.set("openCart", "1");
    window.location.assign(`/researcher?${params.toString()}`);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={`${allowanceLabel} AI allowance · click for AI Boosts`}
        className={`relative z-[82] flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] shadow-sm transition hover:-translate-y-px hover:shadow-md ${
          open
            ? "border-cyan-300 bg-cyan-50 text-cyan-950"
            : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200"
        }`}
      >
        <span className="font-semibold text-slate-800">AI budget</span>
        <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 sm:block">
          <span
            className="block h-full rounded-full bg-cyan-500 transition-[width] duration-500"
            style={{ width: `${remaining ?? 0}%` }}
          />
        </span>
        <span className="whitespace-nowrap">{display}</span>
        <ChevronDown
          className={`h-3 w-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close AI budget menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[76] cursor-default bg-transparent"
          />

          <div className="absolute right-0 top-[calc(100%+10px)] z-[96] w-[340px] overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18),0_4px_18px_rgba(8,145,178,0.08)]">
            <div className="border-b border-cyan-100 bg-gradient-to-br from-white via-white to-cyan-50 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-cyan-700">AI capacity</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">Add more AI headroom</p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-500">
                    Choose a boost. PsyLattice will add it to your marketplace cart and open checkout.
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-100 bg-white text-cyan-700 shadow-sm">
                  <Zap className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div className="space-y-2 p-3">
              {AI_BUDGET_BOOST_CHOICES.map((boost) => (
                <button
                  key={boost.id}
                  type="button"
                  onClick={() => chooseBoost(boost.id)}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left transition hover:border-cyan-200 hover:bg-cyan-50/50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">{boost.name}</span>
                      {"badge" in boost && boost.badge && (
                        <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-cyan-800">
                          {boost.badge}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[9px] leading-4 text-slate-500">{boost.detail}</span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-slate-950">{boost.price}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
              <p className="text-[9px] leading-4 text-slate-500">
                {canBuyAddons
                  ? "Boosts are one-time purchases and do not change your plan."
                  : "AI Boosts require Study Pass or Pro. You can still add one now, then add a paid plan before checkout."}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function CurrentPlanBadge() {
  const [label, setLabel] = useState("Plan");
  const [plan, setPlan] = useState<PlanTier | null>(null);
  const [studyPassCount, setStudyPassCount] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/billing/plan", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = (await response.json()) as PlanBadgeApiResponse;
      if (!response.ok || !data.ok || !data.plan) return;

      const nextPlan = data.plan;
      const passCount = Math.max(0, Math.floor(Number(data.studyPassCount || 0)));
      setPlan(nextPlan);
      setStudyPassCount(passCount);
      setLabel(
        nextPlan === "study-pass"
          ? `Study Pass ×${Math.max(1, passCount)}`
          : nextPlan === "pro-monthly"
            ? "Pro Monthly"
            : nextPlan === "pro-annual"
              ? "Pro Annual"
              : "Free",
      );
    } catch {
      // Keep the header stable if billing status is briefly unavailable.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    const onFocus = () => void refresh();
    const onBillingRefresh = () => void refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("psylattice-billing-refresh", onBillingRefresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("psylattice-billing-refresh", onBillingRefresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;

    function closeOnOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const isPro = plan === "pro-monthly" || plan === "pro-annual";
  const isPass = plan === "study-pass";

  const planDetails =
    plan === "pro-annual"
      ? {
          eyebrow: "Highest default capacity",
          title: "Pro Annual",
          description: "Built for researchers using PsyLattice throughout the academic year.",
          benefits: [
            "Up to 3 simultaneous studies",
            "Up to 500 participants per study",
            "Extended AI allowance + full model switcher",
            "Custom media uploads + 5 GB included storage",
            "Full add-on marketplace access",
          ],
          next: "You are already on PsyLattice's highest self-service research plan.",
          cta: "View Plans & Billing",
        }
      : plan === "pro-monthly"
        ? {
            eyebrow: "Active researcher plan",
            title: "Pro Monthly",
            description: "High-capacity monthly access for ongoing data collection and analysis.",
            benefits: [
              "Up to 3 simultaneous studies",
              "Up to 300 participants per study",
              "High AI allowance + full model switcher",
              "Custom media uploads + 2 GB included storage",
              "Full add-on marketplace access",
            ],
            next: "Upgrade to Pro Annual for 500 participants per study, extended AI capacity and 5 GB media storage.",
            cta: "Upgrade plan",
          }
        : plan === "study-pass"
          ? {
              eyebrow: studyPassCount > 1 ? `${studyPassCount} active Study Passes` : "One-study paid access",
              title: label,
              description: "Paid capacity for a focused thesis, dissertation, pilot or research project.",
              benefits: [
                "Up to 100 participants on each Study Pass study",
                "Standard AI allowance",
                "Selected AI model access",
                "AI, participant and email add-ons available",
                "No recurring subscription for the Study Pass itself",
              ],
              next: "Move to Pro Monthly when you need several active studies, larger default recruitment or media uploads.",
              cta: "Upgrade plan",
            }
          : {
              eyebrow: "Current starter plan",
              title: "Free",
              description: "A real small-study workspace for learning, piloting and evaluating PsyLattice.",
              benefits: [
                "1 study",
                "Up to 50 participants",
                "Starter AI allowance",
                "PsyLattice Auto powered by Gemini Free",
                "Core research workflow access",
              ],
              next: "Study Pass raises one study to 100 participants and unlocks paid AI, participant and email add-ons.",
              cta: "Upgrade plan",
            };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Current PsyLattice plan"
        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold shadow-sm transition hover:-translate-y-px hover:shadow-md ${
          isPro
            ? "border-cyan-300 bg-gradient-to-r from-cyan-900 to-slate-900 text-white"
            : isPass
              ? "border-sky-300 bg-gradient-to-r from-sky-100 to-cyan-50 text-sky-950"
              : "border-cyan-300 bg-cyan-50 text-cyan-950"
        }`}
      >
        {isPro ? (
          <Crown className="h-3.5 w-3.5 text-cyan-200" />
        ) : isPass ? (
          <BadgeCheck className="h-3.5 w-3.5 text-sky-700" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-cyan-700" />
        )}
        <span>{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${
            isPro ? "text-cyan-100" : "text-slate-400"
          } ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close current plan menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[76] cursor-default bg-transparent"
          />
          <div className="absolute right-0 top-[calc(100%+10px)] z-[96] w-[340px] overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18),0_4px_18px_rgba(8,145,178,0.08)]">
          <div className="border-b border-cyan-100 bg-gradient-to-br from-white via-white to-cyan-50 px-5 py-5 text-slate-950">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-700">
                  {planDetails.eyebrow}
                </p>
                <p className="mt-2 text-lg font-bold">{planDetails.title}</p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-100 bg-white text-cyan-700 shadow-sm">
                {isPro ? <Crown className="h-4 w-4" /> : isPass ? <BadgeCheck className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              {planDetails.description}
            </p>
          </div>

          <div className="p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Included in your plan
            </p>
            <div className="mt-3 space-y-2.5">
              {planDetails.benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <p className="text-[11px] leading-4 text-slate-600">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-3.5">
              <p className="text-[10px] font-semibold text-cyan-950">
                {plan === "pro-annual" ? "Plan status" : "Higher-tier benefits"}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-cyan-800/80">{planDetails.next}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                window.location.assign("/researcher?screen=billing");
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(15,23,42,0.16)] transition hover:-translate-y-px hover:bg-cyan-950"
            >
              {planDetails.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

type AiProviderKey = "psylattice" | "openai" | "claude" | "gemini";

function aiProviderForModel(model: Pick<AiModelApiOption, "key" | "name"> | null | undefined): AiProviderKey {
  const key = String(model?.key || "").toLowerCase();
  const name = String(model?.name || "").toLowerCase();

  if (key.includes("openai") || name.includes("openai") || name.includes("gpt")) return "openai";
  if (key.includes("claude") || name.includes("claude") || name.includes("anthropic")) return "claude";
  if (key.includes("gemini") || name.includes("gemini")) return "gemini";
  return "psylattice";
}

function aiProviderLabel(provider: AiProviderKey) {
  if (provider === "openai") return "OpenAI";
  if (provider === "claude") return "Anthropic";
  if (provider === "gemini") return "Google Gemini";
  return "PsyLattice";
}

function AiProviderMark({
  provider,
  compact = false,
}: {
  provider: AiProviderKey;
  compact?: boolean;
}) {
  const boxClass = compact ? "h-7 w-7 rounded-lg" : "h-9 w-9 rounded-xl";
  const iconClass = compact ? "h-4 w-4" : "h-5 w-5";

  if (provider === "psylattice") {
    return (
      <span
        className={`${boxClass} flex shrink-0 items-center justify-center border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-sky-50 text-cyan-800 shadow-sm`}
        aria-label="PsyLattice"
      >
        <Sparkles className={iconClass} strokeWidth={1.8} />
      </span>
    );
  }

  const src =
    provider === "openai"
      ? "/ai-models/openai.svg"
      : provider === "claude"
        ? "/ai-models/claude.svg"
        : "/ai-models/gemini.svg";

  return (
    <span
      className={`${boxClass} flex shrink-0 items-center justify-center border border-slate-200/90 bg-white shadow-sm`}
      aria-label={aiProviderLabel(provider)}
    >
      <img src={src} alt="" aria-hidden="true" className={`${iconClass} object-contain`} />
    </span>
  );
}

export function AiModelSwitcher() {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedModel, setSelectedModel] = useState("auto");
  const [modelAccess, setModelAccess] = useState<"auto-only" | "selected" | "full" | null>(null);
  const [models, setModels] = useState<AiModelApiOption[]>([]);

  const loadModels = useCallback(async () => {
    try {
      const response = await fetch("/api/billing/ai/model", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as AiModelApiResponse;
      if (!response.ok || !data.ok) {
        setNotice(data.error || "AI model access could not be loaded.");
        return;
      }
      setSelectedModel(data.selectedModel || "auto");
      setModelAccess(data.modelAccess || null);
      setModels(data.models || []);
    } catch {
      setNotice("AI model access could not be loaded.");
    }
  }, []);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  const selectedModelOption = models.find((model) => model.key === selectedModel) || null;
  const selectedName = selectedModelOption?.name || "PsyLattice Auto";
  const selectedProvider = aiProviderForModel(
    selectedModelOption || { key: selectedModel, name: selectedName },
  );
  const selectedProviderCaption =
    selectedModel === "auto"
      ? modelAccess === "auto-only"
        ? "Gemini"
        : "Smart routing"
      : aiProviderLabel(selectedProvider);

  async function chooseModel(model: AiModelApiOption) {
    if (saving) return;

    if (!model.allowed) {
      setNotice("Your current plan does not include this model. Upgrade to unlock it.");
      return;
    }
    if (!model.available) {
      setNotice("This provider integration is coming soon.");
      return;
    }

    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/billing/ai/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: model.key }),
      });
      const data = (await response.json()) as AiModelApiResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "The AI model could not be changed.");
      }
      setSelectedModel(data.selectedModel || model.key);
      setModelAccess(data.modelAccess || modelAccess);
      setModels(data.models || models);
      setOpen(false);
      window.dispatchEvent(new Event("psylattice-ai-budget-refresh"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The AI model could not be changed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setNotice("");
          void loadModels();
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`relative z-[82] flex h-[38px] items-center gap-2 rounded-full border px-2.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md ${
          open
            ? "border-cyan-300 bg-cyan-50/90 shadow-[0_8px_22px_rgba(8,145,178,0.12)]"
            : "border-cyan-200/90 bg-white hover:border-cyan-300"
        }`}
      >
        <AiProviderMark provider={selectedProvider} compact />
        <span className="min-w-0">
          <span className="block max-w-[136px] truncate text-[10px] font-bold leading-3.5 text-slate-900 sm:max-w-[160px]">
            {selectedName}
          </span>
          <span className="block text-[7px] font-semibold uppercase tracking-[0.1em] text-cyan-700/80">
            {selectedProviderCaption}
          </span>
        </span>
        <ChevronDown
          className={`ml-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close AI model menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[76] cursor-default bg-transparent"
          />

          <div className="absolute right-0 top-[calc(100%+10px)] z-[96] flex h-[540px] w-[380px] max-h-[calc(100vh-96px)] max-w-[calc(100vw-20px)] flex-col overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_26px_70px_rgba(15,23,42,0.18),0_4px_16px_rgba(8,145,178,0.07)]">
            <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-800">
                      <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-cyan-700">
                        AI models
                      </p>
                      <p className="mt-0.5 text-[14px] font-bold tracking-[-0.015em] text-slate-950">
                        Choose your model
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 max-w-[300px] text-[9px] leading-4 text-slate-500">
                    Choose the provider for your research AI. Model access follows your current plan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close model picker"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {(modelAccess === "auto-only" || selectedModel === "gemini-flash-economy") && (
              <div className="shrink-0 border-b border-slate-100 px-4 py-3">
                <div className="flex items-start gap-2.5 rounded-xl border border-violet-200/80 bg-violet-50/65 px-3 py-2.5">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-700" />
                  <div>
                    <p className="text-[9px] font-bold text-violet-950">Free AI is powered by Gemini</p>
                    <p className="mt-0.5 text-[8px] leading-3.5 text-violet-800/85">
                      Provider data terms may differ. Upgrade to unlock additional model choices.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="shrink-0 flex items-center justify-between px-4 pb-2 pt-3">
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Available models
              </p>
              <p className="text-[8px] text-slate-400">{models.length || "—"} choices</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
              <div className="space-y-1.5 pr-1">
                {models.map((model) => {
                  const selected = model.key === selectedModel;
                  const provider = aiProviderForModel(model);
                  const locked = !model.allowed;
                  const comingSoon = model.allowed && !model.available;
                  const stateLabel = selected
                    ? "Active"
                    : locked
                      ? "Upgrade"
                      : comingSoon
                        ? "Soon"
                        : "Available";

                  const stateClasses = selected
                    ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                    : locked
                      ? "border-slate-200 bg-slate-50 text-slate-500"
                      : comingSoon
                        ? "border-violet-200 bg-violet-50 text-violet-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700";

                  const description =
                    model.key === "auto"
                      ? modelAccess === "auto-only"
                        ? "PsyLattice chooses the best available free research model."
                        : "PsyLattice automatically routes each request to the best available model."
                      : model.available
                        ? model.description
                        : "Provider integration coming later.";

                  return (
                    <button
                      key={model.key}
                      type="button"
                      disabled={saving}
                      onClick={() => void chooseModel(model)}
                      className={`group relative w-full rounded-[15px] border px-3 py-2.5 text-left transition-all duration-150 disabled:cursor-wait disabled:opacity-70 ${
                        selected
                          ? "border-cyan-300 bg-cyan-50/55 shadow-[0_5px_16px_rgba(8,145,178,0.07)]"
                          : "border-slate-200/80 bg-white hover:border-cyan-200 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <AiProviderMark provider={provider} />

                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate text-[10px] font-bold text-slate-900">
                              {model.name}
                            </span>
                            {model.badge && (
                              <span className="shrink-0 rounded-full border border-cyan-100 bg-white px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-[0.06em] text-cyan-700">
                                {model.badge}
                              </span>
                            )}
                          </span>

                          <span className="mt-0.5 block text-[8px] font-medium text-slate-400">
                            {aiProviderLabel(provider)} · Budget {model.impact}
                          </span>

                          <span className="mt-0.5 block truncate text-[8px] text-slate-500">
                            {description}
                          </span>
                        </span>

                        <span className="flex shrink-0 items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-[0.07em] ${stateClasses}`}
                          >
                            {(locked || comingSoon) && <LockKeyhole className="h-2 w-2" />}
                            {stateLabel}
                          </span>
                          {selected && <Check className="h-3.5 w-3.5 text-cyan-600" />}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {models.length === 0 && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-[9px] text-slate-500">
                    Loading your available AI models…
                  </div>
                )}

                {notice && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[8px] leading-3.5 text-amber-900">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{notice}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5">
              <p className="max-w-[230px] text-[7px] leading-3 text-slate-400">
                Availability is enforced by your PsyLattice plan and server configuration.
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  window.location.assign("/researcher?screen=billing");
                }}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[8px] font-bold text-slate-600 shadow-sm transition hover:border-cyan-200 hover:text-cyan-800"
              >
                Plans & Billing
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AiBudgetWarning() {
  const { remaining } = useLiveAiBudget();
  if (remaining === null || remaining > 20) return null;

  return (
    <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/60 p-4 text-xs text-violet-950">
      <p className="font-semibold">
        {remaining === 0 ? "Your AI allowance is exhausted" : "Your AI budget is getting low"}
      </p>
      <p className="mt-1 text-[10px] leading-4">
        {remaining === 0
          ? "Add an AI Boost or upgrade your plan to continue using research AI features."
          : `${remaining}% of your current AI allowance remains. PsyLattice Auto is the most economical routing option.`}
      </p>
    </div>
  );
}

export function AiAddonPopover({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">AI add-ons</p>
        <button type="button" onClick={onClose}>
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {[
          ["Starter Boost", "A little more room for active projects"],
          ["Research Boost", "Best value for regular AI use"],
          ["Power Boost", "For intensive writing and analysis"],
        ].map(([name, detail]) => (
          <div key={name} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <div>
              <p className="text-[11px] font-semibold">{name}</p>
              <p className="mt-0.5 text-[9px] text-slate-500">{detail}</p>
            </div>
            <span className="text-[9px] font-semibold text-cyan-700">View</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type PlanTier = "free" | "study-pass" | "pro-monthly" | "pro-annual";
type CartCategory = "plan" | "ai" | "participants" | "email" | "storage";

type InfoDetails = {
  summary: string;
  benefits: string[];
  useCases: string[];
  notes: string[];
};

type Plan = {
  id: PlanTier;
  name: string;
  price: string;
  priceValue: number;
  cadence?: string;
  eyebrow: string;
  description: string;
  features: string[];
  featured?: boolean;
  badge?: string;
  current?: boolean;
  info: InfoDetails;
};

type MarketplaceItem = {
  id: string;
  category: Exclude<CartCategory, "plan">;
  name: string;
  price: string;
  priceValue: number;
  description: string;
  detail: string;
  badge?: string;
  requires: "paid" | "pro";
  info: InfoDetails;
};

type CartProduct = {
  id: string;
  category: CartCategory;
  name: string;
  price: string;
  priceValue: number;
  description: string;
  info: InfoDetails;
};

type CartLine = {
  product: CartProduct;
  quantity: number;
};

type CheckoutStudy = {
  id: string;
  title: string;
  status: string;
};

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (eventName: string, handler: (response: any) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

function getRazorpayConstructor(): RazorpayConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
}

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayCheckout() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay Checkout is only available in the browser."));
  }

  if (getRazorpayConstructor()) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Razorpay Checkout could not be loaded.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay Checkout could not be loaded."));
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function tierRank(tier: PlanTier) {
  return {
    free: 0,
    "study-pass": 1,
    "pro-monthly": 2,
    "pro-annual": 3,
  }[tier];
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700">
          {eyebrow}
        </p>
        <h3 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-950">
          {title}
        </h3>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function CardActions({
  onInfo,
  onCart,
  cartDisabled,
  cartLabel,
}: {
  onInfo: () => void;
  onCart: () => void;
  cartDisabled?: boolean;
  cartLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onInfo}
        aria-label="More information"
        title="See full details"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
      >
        <Info className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onCart}
        disabled={cartDisabled}
        aria-label={cartLabel || "Add to cart"}
        title={cartLabel || "Add to cart"}
        className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm ${
          cartDisabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
            : "border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
        }`}
      >
        {cartDisabled ? (
          <LockKeyhole className="h-4 w-4" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

function PlanCard({
  plan,
  onInfo,
  onAdd,
  purchaseLocked = false,
  purchaseLockReason,
}: {
  plan: Plan;
  onInfo: () => void;
  onAdd: () => void;
  purchaseLocked?: boolean;
  purchaseLockReason?: string;
}) {
  const disabled =
    plan.id === "free" ||
    (plan.current && plan.id !== "study-pass") ||
    purchaseLocked;

  return (
    <div
      className={`flex min-h-[450px] flex-col rounded-[26px] border p-5 shadow-[0_10px_32px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)] ${
        plan.featured
          ? "border-cyan-300 bg-gradient-to-b from-cyan-50/80 to-white ring-2 ring-cyan-100"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex min-h-[38px] items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
            {plan.eyebrow}
          </p>
          {plan.badge && (
            <span className="mt-2 inline-flex rounded-full bg-cyan-100 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.11em] text-cyan-800">
              {plan.badge}
            </span>
          )}
        </div>
        <CardActions
          onInfo={onInfo}
          onCart={onAdd}
          cartDisabled={disabled}
          cartLabel={
            purchaseLocked
              ? purchaseLockReason || "Manage your current subscription first"
              : plan.current && plan.id === "study-pass"
                ? "Buy Study Pass for another study"
                : plan.current
                  ? "Current plan"
                  : plan.id === "free"
                    ? "Free plan is not a cart item"
                    : "Add plan to cart"
          }
        />
      </div>

      <h4 className="mt-3 text-lg font-semibold text-slate-950">{plan.name}</h4>
      <div className="mt-2 flex items-end gap-1">
        <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
          {plan.price}
        </p>
        {plan.cadence && (
          <span className="pb-1 text-[10px] text-slate-400">{plan.cadence}</span>
        )}
      </div>

      <p className="mt-3 min-h-[42px] text-xs leading-5 text-slate-500">
        {plan.description}
      </p>

      <div className="my-5 h-px bg-slate-100" />

      <ul className="flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2 text-[11px] leading-5 text-slate-600">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
              <Check className="h-3 w-3" />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold ${
          disabled
            ? "cursor-default border border-slate-200 bg-slate-50 text-slate-400"
            : plan.featured
              ? "bg-slate-950 text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] hover:bg-slate-900"
              : "border border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50/50"
        }`}
      >
        {purchaseLocked
          ? purchaseLockReason || "Manage subscription"
          : plan.current && plan.id === "study-pass"
            ? "Buy another Study Pass"
            : plan.current
              ? "Current plan"
              : plan.id === "free"
                ? "Free access"
                : "Add plan to cart"}
        {!disabled && <ShoppingCart className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function MarketplaceCard({
  icon: Icon,
  item,
  accent,
  canAdd,
  lockReason,
  onInfo,
  onAdd,
}: {
  icon: LucideIcon;
  item: MarketplaceItem;
  accent?: boolean;
  canAdd: boolean;
  lockReason?: string;
  onInfo: () => void;
  onAdd: () => void;
}) {
  return (
    <div
      className={`flex min-h-[320px] flex-col rounded-[24px] border p-5 shadow-[0_8px_26px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.09)] ${
        accent
          ? "border-cyan-200 bg-gradient-to-b from-cyan-50/60 to-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
            <Icon className="h-[18px] w-[18px]" />
          </div>
          {item.badge && (
            <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-cyan-800">
              {item.badge}
            </span>
          )}
        </div>
        <CardActions
          onInfo={onInfo}
          onCart={onAdd}
          cartDisabled={!canAdd}
          cartLabel={canAdd ? "Add to cart" : lockReason}
        />
      </div>

      <h4 className="mt-4 text-base font-semibold text-slate-950">{item.name}</h4>
      <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
        {item.price}
      </p>
      <p className="mt-3 text-xs leading-5 text-slate-500">{item.description}</p>

      <div className="mt-4 rounded-2xl bg-slate-50 px-3.5 py-3 text-[10px] leading-4 text-slate-500">
        {item.detail}
      </div>

      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold ${
            canAdd
              ? "bg-slate-950 text-white shadow-[0_8px_18px_rgba(15,23,42,0.14)] hover:bg-slate-900"
              : "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400"
          }`}
        >
          {canAdd ? (
            <>
              Add to cart <ShoppingCart className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              <LockKeyhole className="h-3.5 w-3.5" /> {lockReason || "Unavailable"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function MarketplaceSection({
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_34px_rgba(15,23,42,0.055)] sm:p-6">
      <SectionHeader
        icon={icon}
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      {children}
    </section>
  );
}

function InfoModal({ product, onClose }: { product: CartProduct; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 p-5 backdrop-blur-xl">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-700">Marketplace details</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">{product.name}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-700">{product.price}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
            <p className="text-xs font-semibold text-slate-950">What this gives you</p>
            <p className="mt-2 text-xs leading-6 text-slate-600">{product.info.summary}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-950">Key benefits</p>
              <ul className="mt-3 space-y-2">
                {product.info.benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-2 text-[11px] leading-5 text-slate-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-700" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-950">Real use cases</p>
              <ul className="mt-3 space-y-2">
                {product.info.useCases.map((useCase) => (
                  <li key={useCase} className="flex gap-2 text-[11px] leading-5 text-slate-600">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-700" />
                    {useCase}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2">
              <CircleHelp className="h-4 w-4 text-slate-600" />
              <p className="text-xs font-semibold text-slate-950">Important details</p>
            </div>
            <ul className="mt-3 space-y-2 text-[11px] leading-5 text-slate-600">
              {product.info.notes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartCategoryIcon({ category }: { category: CartCategory }) {
  const Icon =
    category === "plan"
      ? Crown
      : category === "ai"
        ? Sparkles
        : category === "participants"
          ? UsersRound
          : category === "email"
            ? Mail
            : HardDrive;

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-800 shadow-sm">
      <Icon className="h-[18px] w-[18px]" />
    </div>
  );
}

function MarketplaceCheckout({
  lines,
  subtotal,
  onPurchaseSuccess,
}: {
  lines: CartLine[];
  subtotal: number;
  onPurchaseSuccess: (planTier?: PlanTier) => void;
}) {
  const requiresStudy = lines.some(
    (line) => line.product.id === "study-pass" || line.product.category === "participants",
  );
  const recurringPlan = lines.find(
    (line) => line.product.id === "pro-monthly" || line.product.id === "pro-annual",
  );
  const [studies, setStudies] = useState<CheckoutStudy[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [loadingStudies, setLoadingStudies] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!requiresStudy) {
      setStudies([]);
      setSelectedStudyId("");
      return;
    }

    let cancelled = false;
    setLoadingStudies(true);
    setError("");

    fetch("/api/razorpay/marketplace/studies", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Your studies could not be loaded.");
        }
        return payload;
      })
      .then((payload) => {
        if (cancelled) return;
        const nextStudies = Array.isArray(payload.studies) ? payload.studies : [];
        setStudies(nextStudies);
      })
      .catch((failure) => {
        if (!cancelled) {
          setError(failure instanceof Error ? failure.message : "Your studies could not be loaded.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingStudies(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requiresStudy]);

  async function startCheckout() {
    if (busy || lines.length === 0) return;
    if (requiresStudy && !selectedStudyId) {
      setError("Choose the study this purchase should apply to.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const createResponse = await fetch("/api/razorpay/marketplace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          items: lines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
          })),
          studyId: selectedStudyId || null,
        }),
      });

      const checkout = await createResponse.json();
      if (!createResponse.ok || !checkout?.ok) {
        throw new Error(checkout?.error || "Checkout could not be prepared.");
      }

      await loadRazorpayCheckout();
      const RazorpayCheckout = getRazorpayConstructor();
      if (!RazorpayCheckout) throw new Error("Razorpay Checkout did not initialise.");

      const options: Record<string, unknown> = {
        key: checkout.keyId,
        name: "PsyLattice",
        description: checkout.description || "PsyLattice Marketplace",
        currency: "INR",
        prefill: checkout.prefill || undefined,
        theme: { color: "#0891b2" },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setBusy(false);
            setMessage("Checkout was dismissed. Your cart is still here.");
          },
        },
        handler: async (payment: RazorpaySuccess) => {
          try {
            setMessage("Verifying payment securely…");
            const verifyResponse = await fetch("/api/razorpay/marketplace/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({
                purchaseId: checkout.purchaseId,
                ...payment,
              }),
            });
            const verified = await verifyResponse.json();

            if (!verifyResponse.ok || !verified?.ok) {
              throw new Error(verified?.error || "Payment verification failed.");
            }

            if (verified.paid) {
              setMessage(verified.message || "Payment verified. Your purchase is active.");
              onPurchaseSuccess(verified.planTier as PlanTier | undefined);
              return;
            }

            setMessage(
              verified.message ||
                "Payment was verified and is processing. PsyLattice will activate it automatically after capture.",
            );
            setBusy(false);
          } catch (failure) {
            setError(
              failure instanceof Error
                ? failure.message
                : "PsyLattice could not verify this payment right now.",
            );
            setBusy(false);
          }
        },
      };

      if (checkout.kind === "subscription") {
        options.subscription_id = checkout.subscriptionId;
      } else {
        options.order_id = checkout.orderId;
        options.amount = checkout.amountPaise;
      }

      const instance = new RazorpayCheckout(options);
      instance.on("payment.failed", (failure: any) => {
        setBusy(false);
        setError(
          failure?.error?.description ||
            "Razorpay could not complete the payment. No PsyLattice entitlement was activated.",
        );
      });
      instance.open();
    } catch (failure) {
      setBusy(false);
      setError(
        failure instanceof Error ? failure.message : "PsyLattice could not start checkout right now.",
      );
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {requiresStudy && (
        <div className="rounded-[18px] border border-cyan-100 bg-cyan-50/55 p-3.5">
          <div className="flex items-start gap-2.5">
            <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-cyan-800" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-900">Apply study capacity to</p>
              <p className="mt-1 text-[9px] leading-4 text-slate-500">
                Study Pass and participant expansions are attached to one specific research study.
              </p>
              <select
                value={selectedStudyId}
                onChange={(event) => setSelectedStudyId(event.target.value)}
                disabled={loadingStudies || studies.length === 0}
                className="mt-2.5 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-[10px] font-medium text-slate-700 outline-none focus:border-cyan-400"
              >
                <option value="">
                  {loadingStudies
                    ? "Loading your studies…"
                    : studies.length === 0
                      ? "Create a study draft first"
                      : "Choose a study…"}
                </option>
                {studies.map((study) => (
                  <option key={study.id} value={study.id}>
                    {study.title} · {study.status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {recurringPlan && (
        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-white px-3.5 py-3 text-[10px]">
          <div>
            <p className="font-semibold text-slate-900">Recurring Researcher Pro</p>
            <p className="mt-0.5 text-slate-500">
              Add-ons in this cart are charged today; future renewals are the base plan only.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-semibold text-slate-950">{recurringPlan.product.price}</p>
            <p className="text-[8px] uppercase tracking-[0.08em] text-slate-400">renewal</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={startCheckout}
        disabled={
          busy ||
          lines.length === 0 ||
          (requiresStudy && (!selectedStudyId || loadingStudies || studies.length === 0))
        }
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {busy ? "Preparing secure checkout…" : `Pay ${formatINR(subtotal)} with Razorpay`}
        {!busy && <ArrowRight className="h-3.5 w-3.5" />}
      </button>

      <div className="flex items-center justify-center gap-2 text-[8px] font-medium text-slate-400">
        <LockKeyhole className="h-3 w-3" />
        Prices are calculated again on the server. Entitlements activate only after verified payment.
      </div>

      {message && (
        <p className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2.5 text-[9px] leading-4 text-cyan-900">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-[9px] leading-4 text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

function CartDrawer({
  open,
  lines,
  onClose,
  onRemove,
  onQuantity,
  onPurchaseSuccess,
}: {
  open: boolean;
  lines: CartLine[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onQuantity: (id: string, delta: number) => void;
  onPurchaseSuccess: (planTier?: PlanTier) => void;
}) {
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.product.priceValue * line.quantity,
    0,
  );
  const recurringPlan = lines.find(
    (line) => line.product.id === "pro-monthly" || line.product.id === "pro-annual",
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/30 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-[500px] flex-col overflow-hidden border-l border-slate-200 bg-[#f8fbfc] shadow-[-30px_0_90px_rgba(15,23,42,0.22)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="relative overflow-hidden border-b border-cyan-100 bg-white px-6 pb-5 pt-5">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-cyan-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 top-8 h-44 w-44 rounded-full bg-sky-100/60 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
                <PsyLatticeLogo size={34} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold tracking-[-0.02em] text-slate-950">
                    PsyLattice Cart
                  </p>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-cyan-800">
                    Secure checkout
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-medium text-slate-500">
                  World-class research made accessible.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
              aria-label="Close cart"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mt-5 grid grid-cols-[1fr_auto] items-center gap-3 rounded-[22px] border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-sky-50 p-4 shadow-[0_8px_24px_rgba(8,145,178,0.08)]">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-800">
                Your research bundle
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {itemCount === 0
                  ? "Build your plan your way"
                  : `${itemCount} marketplace item${itemCount === 1 ? "" : "s"} selected`}
              </p>
              <p className="mt-1 max-w-[310px] text-[10px] leading-4 text-slate-500">
                One secure Razorpay checkout covers the whole cart. Recurring Pro plans keep one-time add-ons in today&apos;s payment only.
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">Due today</p>
              <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">{formatINR(subtotal)}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {lines.length === 0 ? (
            <div className="flex min-h-[390px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white px-8 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-[0_10px_28px_rgba(8,145,178,0.10)]">
                <ShoppingCart className="h-7 w-7" />
              </div>
              <p className="mt-5 text-base font-semibold text-slate-950">Your cart is ready for research</p>
              <p className="mt-2 max-w-[300px] text-xs leading-5 text-slate-500">
                Choose a plan or add research capacity from the marketplace. Everything you select will appear here with a live total.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2 text-[9px] font-semibold text-slate-500">
                <span className="rounded-full bg-slate-50 px-2.5 py-1.5">AI headroom</span>
                <span className="rounded-full bg-slate-50 px-2.5 py-1.5">Participants</span>
                <span className="rounded-full bg-slate-50 px-2.5 py-1.5">Emails</span>
                <span className="rounded-full bg-slate-50 px-2.5 py-1.5">Media</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map((line) => (
                <div
                  key={line.product.id}
                  className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:border-cyan-200"
                >
                  <div className="flex items-start gap-3">
                    <CartCategoryIcon category={line.product.category} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-950">{line.product.name}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500">
                              {line.product.category === "plan" ? "Plan" : "Add-on"}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] text-slate-500">{line.product.price} each</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemove(line.product.id)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Remove ${line.product.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-slate-500">
                        {line.product.description}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        {line.product.category === "plan" ? (
                          <span className="rounded-full bg-cyan-50 px-2.5 py-1.5 text-[9px] font-semibold text-cyan-800">
                            {recurringPlan?.product.id === line.product.id ? "Recurring plan" : "1 selected plan"}
                          </span>
                        ) : (
                          <div className="flex items-center rounded-full border border-slate-200 bg-slate-50/70 p-0.5">
                            <button
                              type="button"
                              onClick={() => onQuantity(line.product.id, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-slate-950"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-8 text-center text-[10px] font-semibold text-slate-700">{line.quantity}</span>
                            <button
                              type="button"
                              onClick={() => onQuantity(line.product.id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-slate-950"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-sm font-semibold text-slate-950">
                          {formatINR(line.product.priceValue * line.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-5">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Marketplace items</span>
              <span className="font-semibold text-slate-700">{itemCount}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Cart total</span>
              <span className="font-semibold text-slate-700">{formatINR(subtotal)}</span>
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-cyan-800">Total due today</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {recurringPlan
                    ? "Includes the first Pro cycle plus one-time cart add-ons."
                    : "One-time marketplace payment."}
                </p>
              </div>
              <span className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">{formatINR(subtotal)}</span>
            </div>
          </div>

          <MarketplaceCheckout
            lines={lines}
            subtotal={subtotal}
            onPurchaseSuccess={onPurchaseSuccess}
          />
        </div>
      </aside>
    </div>
  );
}

export function PlansAndBilling({ currentPlan = "free" }: { currentPlan?: PlanTier }) {
  const [cartOpen, setCartOpen] = useState(false);
  const pendingCartHydratedRef = useRef(false);
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [infoProduct, setInfoProduct] = useState<CartProduct | null>(null);
  const [billingPlan, setBillingPlan] = useState<PlanTier>(currentPlan);

  const refreshBillingStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/razorpay/marketplace/status", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });
      const payload = await response.json();
      if (response.ok && payload?.ok && payload?.planTier) {
        setBillingPlan(payload.planTier as PlanTier);
      }
    } catch {
      // The page can still use the server-provided/fallback plan if billing status
      // is briefly unavailable. Checkout itself always validates server-side.
    }
  }, []);

  useEffect(() => {
    void refreshBillingStatus();
  }, [refreshBillingStatus]);

  const plans: Plan[] = [
    {
      id: "free",
      name: "Free",
      price: "₹0",
      priceValue: 0,
      eyebrow: "Start here",
      description:
        "Experience the core PsyLattice research workflow before paying for additional study capacity.",
      features: [
        "1 study",
        "Up to 50 participants",
        "Starter AI allowance",
        "PsyLattice Auto only",
        "No add-on purchases",
        "No custom media uploads",
      ],
      current: billingPlan === "free",
      info: {
        summary:
          "The Free tier is designed to let a researcher build and run one genuine small study, learn the workflow and experience PsyLattice AI without creating an unlimited recurring infrastructure cost.",
        benefits: [
          "Enough participant capacity for a small pilot, classroom project or early-stage study.",
          "Access to the core research workflow before committing to a paid plan.",
          "A generous Starter AI allowance is available through PsyLattice Auto, powered by Gemini 3.5 Flash-Lite Free Tier on Free accounts.",
          "A clean upgrade path when participant, AI or media requirements increase.",
        ],
        useCases: [
          "A bachelor student testing a first experimental or survey design.",
          "A researcher evaluating PsyLattice before moving a larger project onto the platform.",
          "A workshop participant creating and piloting a small demonstration study.",
        ],
        notes: [
          "Participant ceiling: 50 for the free study.",
          "AI model switching is unavailable on Free. PsyLattice Auto is pinned to Gemini 3.5 Flash-Lite Free Tier and cannot silently route to OpenAI.",
          "Google Free Tier data terms apply to Free AI usage; content sent to the model may be used by Google to improve its products. Avoid confidential or sensitive information unless you are comfortable with those terms.",
          "Free users cannot purchase AI, participant, email or media add-ons until a paid plan is added.",
          "Custom media uploads are unavailable.",
        ],
      },
    },
    {
      id: "study-pass",
      name: "Study Pass",
      price: "₹499",
      priceValue: 499,
      cadence: "per study",
      eyebrow: "One serious study",
      description:
        "For a thesis, dissertation, pilot or focused research project that does not need an ongoing subscription.",
      features: [
        "1 paid study",
        "Up to 100 participants",
        "Standard AI allowance",
        "Selected AI model access",
        "AI, participant and email add-ons available",
        "No custom media uploads",
      ],
      current: billingPlan === "study-pass",
      info: {
        summary:
          "Study Pass turns one project into a full paid PsyLattice study without requiring a subscription. It is intentionally positioned as a strong one-project option while keeping Pro Monthly more attractive for repeat or expanding researchers.",
        benefits: [
          "A complete paid study with a 100-participant default ceiling.",
          "A larger AI allowance than Free with selected model choice.",
          "Ability to buy AI, participant and participant-email expansions for this study.",
          "No recurring subscription after the purchased study.",
        ],
        useCases: [
          "A master's student conducting one thesis study during a semester.",
          "A researcher running a single funded pilot before applying for a larger grant.",
          "A dissertation project that may need a participant or AI top-up but not three simultaneous studies.",
        ],
        notes: [
          "Default participant ceiling: 100 for the purchased study.",
          "Media uploads remain unavailable on Study Pass.",
          "Participant and AI boosts are attached to paid capacity, not to Free access.",
          "If several add-ons are needed repeatedly, Pro Monthly is designed to become the better-value path.",
        ],
      },
    },
    {
      id: "pro-monthly",
      name: "Pro Monthly",
      price: "₹749",
      priceValue: 749,
      cadence: "/ month",
      eyebrow: "For active researchers",
      description:
        "For researchers who are continuously collecting data, analysing results and developing multiple studies.",
      features: [
        "Up to 3 simultaneous studies",
        "Up to 300 participants per study",
        "High AI allowance",
        "Full AI model switcher",
        "Custom media uploads",
        "2 GB included media storage",
        "Full add-on marketplace access",
      ],
      featured: true,
      badge: "Most popular",
      current: billingPlan === "pro-monthly",
      info: {
        summary:
          "Pro Monthly is the main active-researcher plan. It raises the default study, participant, AI and media ceilings enough that researchers should not need to think about add-ons during normal day-to-day work.",
        benefits: [
          "Run up to three studies at the same time.",
          "300 participants per study before buying any expansion.",
          "High AI allowance with access to the full model switcher.",
          "Custom media uploads across supported PsyLattice research tools.",
          "2 GB included media storage and access to every marketplace add-on category.",
        ],
        useCases: [
          "A postgraduate researcher running a main study, a pilot and a follow-up concurrently.",
          "A lab member using Thesis Builder, Cognitive Lab, Analysis Lab and AI throughout the month.",
          "A researcher who would otherwise keep buying Study Pass AI or participant extensions.",
        ],
        notes: [
          "Default participant ceiling: 300 per simultaneous study.",
          "Up to three simultaneous studies are included.",
          "AI allowance refresh behavior should be enforced server-side according to your billing policy.",
          "Media and all add-on categories are available.",
        ],
      },
    },
    {
      id: "pro-annual",
      name: "Pro Annual",
      price: "₹7,499",
      priceValue: 7499,
      cadence: "/ year",
      eyebrow: "Best long-term value",
      description:
        "For committed researchers who want the highest default capacity and the lowest effective long-term price.",
      features: [
        "Up to 3 simultaneous studies",
        "Up to 500 participants per study",
        "Extended AI allowance",
        "Full AI model switcher",
        "Custom media uploads",
        "5 GB included media storage",
        "Full add-on marketplace access",
        "About 17% cheaper than paying monthly",
      ],
      badge: "Best value",
      current: billingPlan === "pro-annual",
      info: {
        summary:
          "Pro Annual is built for researchers who expect PsyLattice to be part of their workflow throughout the academic year. It raises the participant and media defaults while lowering the effective monthly subscription cost.",
        benefits: [
          "500 participants per study before any participant expansion.",
          "Extended AI allowance with full model access.",
          "5 GB included media storage for richer research materials.",
          "Three simultaneous studies and full marketplace access.",
          "Lower effective annual cost than paying Pro Monthly for twelve months.",
        ],
        useCases: [
          "A PhD researcher running several studies and follow-ups across an academic year.",
          "A small research team using one researcher's workspace continuously.",
          "A researcher with larger recruitment targets who wants to avoid recurring participant add-ons.",
        ],
        notes: [
          "Default participant ceiling: 500 per study.",
          "Up to three simultaneous studies are included.",
          "Annual billing should define renewal and cancellation rules in the checkout flow and Terms.",
          "Institutional deployments beyond these ceilings should use custom pricing.",
        ],
      },
    },
  ];

  const aiBoosts: MarketplaceItem[] = [
    {
      id: "ai-starter",
      category: "ai",
      name: "Starter Boost",
      price: "₹99",
      priceValue: 99,
      description:
        "A small AI budget top-up for finishing lighter writing, study-design or analysis tasks.",
      detail:
        "Best when the current allowance is almost enough and you only need a little extra headroom.",
      requires: "paid",
      info: {
        summary:
          "Starter Boost adds a small amount of AI headroom to a paid PsyLattice account without exposing internal token counts. The AI Budget meter simply gains more usable capacity.",
        benefits: [
          "Low-cost way to finish a study without immediately changing plan.",
          "Works across AI-assisted research workflows that draw from the same PsyLattice AI budget.",
          "Keeps the customer experience percentage-based rather than token-based.",
        ],
        useCases: [
          "A Study Pass user finishing a few final Thesis Builder revisions.",
          "A researcher needing several additional Analysis AI explanations near the end of a project.",
          "A short period of extra study-design assistance before submission.",
        ],
        notes: [
          "Requires Study Pass or Pro.",
          "The exact internal allowance represented by this boost remains hidden from users.",
          "Premium models may consume the AI budget faster than economical models.",
        ],
      },
    },
    {
      id: "ai-research",
      category: "ai",
      name: "Research Boost",
      price: "₹249",
      priceValue: 249,
      description:
        "A substantial AI top-up for active research, longer conversations and repeated analysis support.",
      detail:
        "Priced so that frequent Study Pass users naturally start comparing the total with Pro Monthly.",
      badge: "Popular",
      requires: "paid",
      info: {
        summary:
          "Research Boost is the default one-off AI expansion for a serious project. It is meant to feel valuable for occasional heavy use while still making Pro Monthly the smarter choice when top-ups become frequent.",
        benefits: [
          "More room for thesis assistance, analysis explanations and study development.",
          "One purchase can cover a concentrated high-workload research period.",
          "Avoids forcing an immediate subscription when the need is temporary.",
        ],
        useCases: [
          "A thesis-writing week with repeated restructuring, clarity and citation-context questions.",
          "A quantitative analysis phase where the researcher repeatedly asks Analyst AI to explain outputs.",
          "Building and refining several cognitive or ambulatory study components in one project.",
        ],
        notes: [
          "Requires Study Pass or Pro.",
          "Frequent purchases should be surfaced against the value of Pro Monthly.",
          "Budget impact still varies by selected model even though users never see token counts.",
        ],
      },
    },
    {
      id: "ai-power",
      category: "ai",
      name: "Power Boost",
      price: "₹499",
      priceValue: 499,
      description:
        "A large AI budget increase for intensive writing, complex analysis guidance and heavy AI-assisted workflows.",
      detail:
        "Best for a short burst of unusually heavy use; repeated purchases should strongly favor upgrading to Pro.",
      requires: "paid",
      info: {
        summary:
          "Power Boost is the largest standard one-off AI expansion. It is deliberately priced close enough to the subscription ladder that a heavy Study Pass user sees Pro Monthly as the better recurring solution.",
        benefits: [
          "Large temporary increase in available AI headroom.",
          "Useful during intensive analysis, writing or study-building periods.",
          "No need to expose model token accounting to the researcher.",
        ],
        useCases: [
          "A major thesis revision or dissertation submission sprint.",
          "A short project phase involving many advanced reasoning requests.",
          "A high-intensity workshop or collaborative research sprint on one paid workspace.",
        ],
        notes: [
          "Requires Study Pass or Pro.",
          "At this price point, Pro Monthly should be prominently compared for recurring users.",
          "This boost changes AI capacity only; it does not increase participant or media limits.",
        ],
      },
    },
  ];

  const participantBoosts: MarketplaceItem[] = [
    {
      id: "participants-100",
      category: "participants",
      name: "+100 participants",
      price: "₹149",
      priceValue: 149,
      description:
        "Increase the recruitment ceiling of one selected study by one hundred participants.",
      detail: "Good for recruitment overshoot, an expanded pilot or a modest sample-size revision.",
      requires: "paid",
      info: {
        summary:
          "This add-on attaches additional recruitment capacity to one selected paid study. It does not raise the participant ceiling of every study in the account.",
        benefits: [
          "Increase sample size without changing the whole plan.",
          "Useful when recruitment succeeds beyond the original target.",
          "Keeps one-off larger studies affordable for Study Pass researchers.",
        ],
        useCases: [
          "A Study Pass project moves from N=100 to N=180 after a revised power analysis.",
          "A Pro study needs a modest buffer above its included 300-participant limit.",
          "A pilot expands after early recruitment shows stronger-than-expected feasibility.",
        ],
        notes: [
          "Requires a paid plan or a paid plan in the same cart.",
          "Applied to one selected study.",
          "Participant expansions should be chosen before the study reaches its active recruitment ceiling.",
        ],
      },
    },
    {
      id: "participants-200",
      category: "participants",
      name: "+200 participants",
      price: "₹249",
      priceValue: 249,
      description:
        "A larger one-study recruitment expansion for studies that clearly outgrow their default capacity.",
      detail: "The natural middle option when +100 is too small but +500 would be unnecessary.",
      badge: "Best balance",
      requires: "paid",
      info: {
        summary:
          "The +200 pack is the main participant-expansion option for a serious one-off study. On Study Pass, the combined price intentionally approaches Pro Monthly so the researcher can compare which route is actually better value.",
        benefits: [
          "Adds meaningful sample capacity without buying the largest pack.",
          "Works well for powered confirmatory studies with a revised target.",
          "Gives Pro researchers a simple way to extend one unusually large study.",
        ],
        useCases: [
          "A Study Pass study needs roughly 250-300 total participants.",
          "A Pro Monthly study needs a target around N=450.",
          "A multi-wave design anticipates exclusions and wants additional recruitment headroom.",
        ],
        notes: [
          "Applied to one selected study.",
          "Requires Study Pass or Pro.",
          "The checkout should show the final study participant ceiling after the add-on is applied.",
        ],
      },
    },
    {
      id: "participants-500",
      category: "participants",
      name: "+500 participants",
      price: "₹499",
      priceValue: 499,
      description:
        "The largest standard participant expansion for high-volume academic research.",
      detail: "For studies that need substantially more recruitment capacity without moving to an institutional agreement.",
      requires: "paid",
      info: {
        summary:
          "The +500 pack is the largest self-service participant expansion. It is intended for unusually large individual studies; sustained higher-volume needs should move toward institutional pricing.",
        benefits: [
          "Large one-study recruitment increase in a single purchase.",
          "Avoids stacking many small participant packs.",
          "Supports larger academic samples while keeping an institutional tier above self-service pricing.",
        ],
        useCases: [
          "A large online behavioral study aiming for several hundred additional participants.",
          "A Pro Annual researcher running one unusually large recruitment campaign.",
          "A university project that is large but still managed by one researcher rather than an institution-wide deployment.",
        ],
        notes: [
          "Applied to one selected study.",
          "Requires a paid plan.",
          "For requirements beyond repeated +500 expansions, surface institutional pricing instead.",
        ],
      },
    },
  ];

  const emailBoosts: MarketplaceItem[] = [
    {
      id: "email-1000",
      category: "email",
      name: "+1,000 participant emails",
      price: "₹49",
      priceValue: 49,
      description:
        "Extra capacity for recruitment invitations, reminders and follow-up communication.",
      detail: "A low-cost buffer for smaller longitudinal studies or an active recruitment period.",
      requires: "paid",
      info: {
        summary:
          "This pack adds participant-email capacity to a paid PsyLattice workspace for invitation, reminder and follow-up workflows.",
        benefits: [
          "Low-cost way to extend study communication capacity.",
          "Useful for repeated reminders without changing research-plan capacity.",
          "Separates communication usage from participant limits.",
        ],
        useCases: [
          "A 100-participant Study Pass project sends several scheduled reminders.",
          "A longitudinal study adds another follow-up wave.",
          "Recruitment requires a second or third invitation round.",
        ],
        notes: [
          "Requires Study Pass or Pro.",
          "Email packs increase sending allowance, not participant capacity.",
          "Anti-abuse and deliverability limits should remain enforced server-side.",
        ],
      },
    },
    {
      id: "email-5000",
      category: "email",
      name: "+5,000 participant emails",
      price: "₹149",
      priceValue: 149,
      description:
        "A larger communication pack for repeated assessments, follow-ups and active recruitment.",
      detail: "A strong fit for EMA, ESM and multi-wave studies with repeated participant contact.",
      badge: "Popular",
      requires: "paid",
      info: {
        summary:
          "The +5,000 pack supports research designs where communication is part of the protocol rather than an occasional recruitment message.",
        benefits: [
          "Enough capacity for repeated reminders across larger studies.",
          "Useful for multiple follow-up waves or higher-frequency assessment schedules.",
          "Lower effective email cost than repeatedly buying the smallest pack.",
        ],
        useCases: [
          "A multi-week EMA protocol sends scheduled availability reminders.",
          "A cohort study contacts participants at baseline and several follow-up points.",
          "An active recruitment campaign needs repeated communication across hundreds of participants.",
        ],
        notes: [
          "Requires a paid plan.",
          "Email frequency should still respect participant consent and approved study communication procedures.",
          "This pack does not change AI or participant ceilings.",
        ],
      },
    },
    {
      id: "email-15000",
      category: "email",
      name: "+15,000 participant emails",
      price: "₹349",
      priceValue: 349,
      description:
        "High-volume communication capacity for studies with many participants or repeated contact points.",
      detail: "For intensive longitudinal designs, multi-study recruitment or frequent follow-up workflows.",
      requires: "paid",
      info: {
        summary:
          "The largest standard email pack is designed for high-frequency longitudinal research and large recruitment workflows while keeping communication costs explicit and controllable.",
        benefits: [
          "High-volume email headroom in one purchase.",
          "Supports communication-heavy longitudinal designs.",
          "Reduces the need to repeatedly purchase smaller packs.",
        ],
        useCases: [
          "A large repeated-measures study with several reminder points.",
          "Multiple active Pro studies all sending recruitment and follow-up emails.",
          "A long-term cohort with recurring scheduled participant communication.",
        ],
        notes: [
          "Requires a paid plan.",
          "For institution-wide messaging, custom institutional limits may be more appropriate.",
          "All sending remains subject to consent, deliverability and anti-abuse safeguards.",
        ],
      },
    },
  ];

  const storageBoosts: MarketplaceItem[] = [
    {
      id: "storage-5gb",
      category: "storage",
      name: "+5 GB media storage",
      price: "₹99",
      priceValue: 99,
      description:
        "Add workspace storage for images, audio, video and other permitted research media.",
      detail: "Available only when a Pro plan is active or being purchased in the same cart.",
      requires: "pro",
      info: {
        summary:
          "This storage pack expands the shared Pro media pool used by supported PsyLattice research tools. It does not unlock media uploads by itself; Pro is required first.",
        benefits: [
          "Low-cost storage expansion for media-enabled research.",
          "Shared capacity across supported Questionnaire, Cognitive, Ambulatory and Thesis workflows.",
          "Keeps Study Pass deliberately media-free while giving Pro users flexible storage growth.",
        ],
        useCases: [
          "Adding image stimuli to questionnaires or cognitive tasks.",
          "Storing permitted audio or video research materials.",
          "A Pro researcher slightly exceeds the included 2 GB or 5 GB pool.",
        ],
        notes: [
          "Requires Pro Monthly or Pro Annual.",
          "Storage expansion does not change participant or AI capacity.",
          "File-type, privacy and retention rules should still be enforced by the platform.",
        ],
      },
    },
    {
      id: "storage-20gb",
      category: "storage",
      name: "+20 GB media storage",
      price: "₹249",
      priceValue: 249,
      description:
        "A larger media pool for image-, audio- and video-rich research workflows.",
      detail: "Best for researchers regularly using custom media across several active studies.",
      badge: "Best value",
      requires: "pro",
      info: {
        summary:
          "The +20 GB pack is the main media expansion for active Pro researchers who routinely use custom research assets and no longer fit comfortably within the included storage.",
        benefits: [
          "Substantial storage increase at a better effective price than small repeated top-ups.",
          "Supports several media-rich studies inside the same Pro workspace.",
          "Keeps the platform flexible without forcing institutional pricing too early.",
        ],
        useCases: [
          "Multiple cognitive tasks with image or audio stimulus sets.",
          "Media-supported questionnaires across several active studies.",
          "Longer-term thesis or lab work with recurring permitted research assets.",
        ],
        notes: [
          "Pro only.",
          "The storage pool is workspace capacity, not a participant upload quota unless your backend explicitly maps it that way.",
          "Very large sustained media requirements should move toward institutional plans.",
        ],
      },
    },
    {
      id: "storage-50gb",
      category: "storage",
      name: "+50 GB media storage",
      price: "₹499",
      priceValue: 499,
      description:
        "The largest standard self-service media expansion for substantial research programmes.",
      detail: "For media-heavy Pro workflows before custom institutional storage becomes more appropriate.",
      requires: "pro",
      info: {
        summary:
          "The +50 GB pack is intended for advanced Pro users with sustained media needs. It is the top of the self-service storage ladder before institutional pricing.",
        benefits: [
          "Large media headroom in one purchase.",
          "Supports complex multi-study research programmes with richer assets.",
          "Avoids repeatedly stacking small storage packs.",
        ],
        useCases: [
          "A lab-style Pro workspace using many image and audio stimuli.",
          "A series of media-heavy experiments run across several months.",
          "A researcher approaching institutional-scale storage but still operating a self-service account.",
        ],
        notes: [
          "Pro only.",
          "Institutional pricing should be surfaced for requirements beyond normal self-service usage.",
          "Storage purchases should inherit the same privacy and data-retention controls as the underlying workspace.",
        ],
      },
    },
  ];

  useEffect(() => {
    if (pendingCartHydratedRef.current) return;
    pendingCartHydratedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const requestedProductId = params.get("addToCart");
    const shouldOpenCart = params.get("openCart") === "1";

    if (requestedProductId) {
      const requestedBoost = aiBoosts.find((item) => item.id === requestedProductId);
      if (requestedBoost) {
        const product: CartProduct = {
          id: requestedBoost.id,
          category: requestedBoost.category,
          name: requestedBoost.name,
          price: requestedBoost.price,
          priceValue: requestedBoost.priceValue,
          description: requestedBoost.description,
          info: requestedBoost.info,
        };

        setCartLines((current) => {
          const existing = current.find((line) => line.product.id === product.id);
          if (existing) {
            return current.map((line) =>
              line.product.id === product.id
                ? { ...line, quantity: line.quantity + 1 }
                : line,
            );
          }
          return [...current, { product, quantity: 1 }];
        });
      }
    }

    if (shouldOpenCart || requestedProductId) setCartOpen(true);

    if (requestedProductId || shouldOpenCart) {
      params.delete("addToCart");
      params.delete("openCart");
      const query = params.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
      );
    }
  }, []);

  const selectedPlanInCart = cartLines.find((line) => line.product.category === "plan")?.product.id as PlanTier | undefined;
  const effectivePlan: PlanTier = selectedPlanInCart || billingPlan;

  const itemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const cartSubtotal = cartLines.reduce(
    (sum, line) => sum + line.product.priceValue * line.quantity,
    0,
  );

  function toPlanProduct(plan: Plan): CartProduct {
    return {
      id: plan.id,
      category: "plan",
      name: plan.name,
      price: `${plan.price}${plan.cadence ? ` ${plan.cadence}` : ""}`,
      priceValue: plan.priceValue,
      description: plan.description,
      info: plan.info,
    };
  }

  function toAddonProduct(item: MarketplaceItem): CartProduct {
    return {
      id: item.id,
      category: item.category,
      name: item.name,
      price: item.price,
      priceValue: item.priceValue,
      description: item.description,
      info: item.info,
    };
  }

  function addProduct(product: CartProduct) {
    setCartLines((current) => {
      if (product.category === "plan") {
        const withoutPlans = current.filter((line) => line.product.category !== "plan");
        return [{ product, quantity: 1 }, ...withoutPlans];
      }

      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function removeProduct(id: string) {
    setCartLines((current) => current.filter((line) => line.product.id !== id));
  }

  function changeQuantity(id: string, delta: number) {
    setCartLines((current) =>
      current
        .map((line) =>
          line.product.id === id
            ? { ...line, quantity: Math.max(0, line.quantity + delta) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function canAddAddon(item: MarketplaceItem) {
    if (item.requires === "pro") return tierRank(effectivePlan) >= tierRank("pro-monthly");
    return tierRank(effectivePlan) >= tierRank("study-pass");
  }

  function addonLockReason(item: MarketplaceItem) {
    if (item.requires === "pro") return "Requires Pro Monthly or Pro Annual";
    return "Add Study Pass or Pro first";
  }

  const allProducts: CartProduct[] = [
    ...plans.map(toPlanProduct),
    ...aiBoosts.map(toAddonProduct),
    ...participantBoosts.map(toAddonProduct),
    ...emailBoosts.map(toAddonProduct),
    ...storageBoosts.map(toAddonProduct),
  ];

  function showPlanInfo(plan: Plan) {
    setInfoProduct(allProducts.find((product) => product.id === plan.id) || toPlanProduct(plan));
  }

  function showAddonInfo(item: MarketplaceItem) {
    setInfoProduct(allProducts.find((product) => product.id === item.id) || toAddonProduct(item));
  }

  return (
    <div className="space-y-7 pb-10">
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.07)]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_.75fr] lg:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-800">
                PsyLattice Marketplace
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[9px] font-semibold text-slate-500">
                Plans + research add-ons
              </span>
            </div>

            <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-slate-950">
              Scale your research only when you need to.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Upgrade your plan, extend a single study, add AI headroom, increase
              participant capacity or expand communication and media resources —
              all from one marketplace.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <AiBudgetIndicator />
            </div>
            <AiBudgetWarning />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="group relative min-h-[158px] overflow-hidden rounded-[24px] border border-cyan-200 bg-gradient-to-br from-white via-cyan-50/75 to-sky-50 text-left shadow-[0_12px_30px_rgba(8,145,178,0.10)] transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_18px_38px_rgba(8,145,178,0.14)]"
            >
              <div className="absolute inset-y-0 left-0 flex w-12 items-center justify-center bg-slate-900 text-white">
                <span
                  className="text-[8px] font-bold uppercase tracking-[0.22em]"
                  style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  Your cart
                </span>
              </div>

              <div className="flex h-full flex-col justify-between py-4 pl-16 pr-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-100 bg-white text-cyan-800 shadow-sm">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <span className="flex min-w-8 items-center justify-center rounded-full bg-slate-950 px-2.5 py-1.5 text-[9px] font-bold text-white shadow-sm">
                    {itemCount}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Marketplace cart</p>
                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                        Review your plan, add-ons and running total.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-bold uppercase tracking-[0.11em] text-slate-400">Total</p>
                      <p className="mt-1 text-base font-semibold tracking-[-0.03em] text-slate-950">{formatINR(cartSubtotal)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-cyan-800">
                    Open cart
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </button>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-slate-700" />
                <p className="text-xs font-semibold text-slate-900">Simple upgrade path</p>
              </div>
              <p className="mt-2 text-[10px] leading-5 text-slate-500">
                Free → Study Pass → Pro Monthly → Pro Annual. Add-ons increase capacity without forcing an immediate plan change.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          icon={Crown}
          eyebrow="Plans"
          title="Choose how you want to use PsyLattice"
          description="Every plan has a clear research ceiling. Add one plan to the cart; choosing another automatically replaces the previous plan selection."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              purchaseLocked={
                tierRank(billingPlan) >= tierRank("pro-monthly") &&
                !plan.current &&
                plan.id !== "free"
              }
              purchaseLockReason={
                plan.id === "study-pass"
                  ? "Included with current Pro"
                  : "Manage current Pro subscription first"
              }
              onInfo={() => showPlanInfo(plan)}
              onAdd={() => addProduct(toPlanProduct(plan))}
            />
          ))}
        </div>
      </section>

      <MarketplaceSection
        icon={Sparkles}
        eyebrow="AI capacity"
        title="AI Boosts"
        description="Top up the visible AI Budget without exposing token counts. The amount is represented as additional usable AI headroom."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {aiBoosts.map((item, index) => (
            <MarketplaceCard
              key={item.id}
              icon={index === 0 ? Zap : index === 1 ? Sparkles : Cpu}
              item={item}
              accent={index === 1}
              canAdd={canAddAddon(item)}
              lockReason={addonLockReason(item)}
              onInfo={() => showAddonInfo(item)}
              onAdd={() => addProduct(toAddonProduct(item))}
            />
          ))}
        </div>
      </MarketplaceSection>

      <MarketplaceSection
        icon={UsersRound}
        eyebrow="Recruitment capacity"
        title="Participant Expansion"
        description="Increase the participant ceiling of one selected study. Free users need a paid plan before participant expansions can be purchased."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {participantBoosts.map((item, index) => (
            <MarketplaceCard
              key={item.id}
              icon={UsersRound}
              item={item}
              accent={index === 1}
              canAdd={canAddAddon(item)}
              lockReason={addonLockReason(item)}
              onInfo={() => showAddonInfo(item)}
              onAdd={() => addProduct(toAddonProduct(item))}
            />
          ))}
        </div>
      </MarketplaceSection>

      <MarketplaceSection
        icon={Mail}
        eyebrow="Participant communication"
        title="Notification Email Packs"
        description="Add more capacity for invitations, reminders and follow-up communication when a study needs repeated participant contact."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {emailBoosts.map((item, index) => (
            <MarketplaceCard
              key={item.id}
              icon={Mail}
              item={item}
              accent={index === 1}
              canAdd={canAddAddon(item)}
              lockReason={addonLockReason(item)}
              onInfo={() => showAddonInfo(item)}
              onAdd={() => addProduct(toAddonProduct(item))}
            />
          ))}
        </div>
      </MarketplaceSection>

      <MarketplaceSection
        icon={HardDrive}
        eyebrow="Pro workspace"
        title="Media Storage"
        description="Custom media uploads remain a Pro feature. Pro users can expand the shared workspace media pool as their research grows."
      >
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3 text-[10px] leading-5 text-violet-900">
          <LockKeyhole className="h-4 w-4 shrink-0" />
          Study Pass does not unlock media. Add Pro Monthly or Pro Annual to the cart first, then media-storage cards become purchasable.
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {storageBoosts.map((item, index) => (
            <MarketplaceCard
              key={item.id}
              icon={HardDrive}
              item={item}
              accent={index === 1}
              canAdd={canAddAddon(item)}
              lockReason={addonLockReason(item)}
              onInfo={() => showAddonInfo(item)}
              onAdd={() => addProduct(toAddonProduct(item))}
            />
          ))}
        </div>
      </MarketplaceSection>

      <section className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_14px_40px_rgba(15,23,42,0.14)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <PackagePlus className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                Institutional research
              </p>
              <h3 className="mt-1 text-xl font-semibold">Need more than the marketplace offers?</h3>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-300">
                Larger participant volumes, storage pools, research teams and university-wide access can move to a custom institutional plan.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-slate-950 hover:bg-cyan-50"
          >
            Contact PsyLattice
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      <CartDrawer
        open={cartOpen}
        lines={cartLines}
        onClose={() => setCartOpen(false)}
        onRemove={removeProduct}
        onQuantity={changeQuantity}
        onPurchaseSuccess={(nextPlan) => {
          if (nextPlan) setBillingPlan(nextPlan);
          setCartLines([]);
          setCartOpen(false);
          window.dispatchEvent(new Event("psylattice-billing-refresh"));
          window.dispatchEvent(new Event("psylattice-ai-budget-refresh"));
          void refreshBillingStatus();
        }}
      />

      {infoProduct && (
        <InfoModal product={infoProduct} onClose={() => setInfoProduct(null)} />
      )}
    </div>
  );
}
