"use client";

import { useEffect, useState } from "react";
import BaseFollowupManager from "@/components/FollowupManager";

type Props = {
  preferredStudyId: string;
  onStudyIdChange: (studyId: string) => void;
  onBack: () => void;
  onBuildQuestionnaire?: () => void;
};

type Entitlements = {
  planName: string;
  hasPro: boolean;
  hasAnyStudyPass: boolean;
  selectedStudyHasPass: boolean;
  studyPassCount: number;
};

export default function PlanAwareFollowupManager(props: Props) {
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const query = props.preferredStudyId
      ? `?studyId=${encodeURIComponent(props.preferredStudyId)}`
      : "";

    setLoading(true);
    setError("");

    fetch(`/api/billing/me${query}`, {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "PsyLattice could not verify follow-up access.");
        }
        return payload.entitlements as Entitlements;
      })
      .then((value) => {
        if (!cancelled) setEntitlements(value);
      })
      .catch((failure) => {
        if (!cancelled) {
          setError(
            failure instanceof Error
              ? failure.message
              : "PsyLattice could not verify follow-up access.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [props.preferredStudyId]);

  if (loading) {
    return (
      <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Checking follow-up access…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-[26px] border border-red-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-red-800">Follow-up access could not be verified</p>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <button type="button" onClick={props.onBack} className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white">
          Back to Study Builder
        </button>
      </section>
    );
  }

  const exactStudyLocked = Boolean(
    props.preferredStudyId &&
      entitlements &&
      !entitlements.hasPro &&
      !entitlements.selectedStudyHasPass,
  );
  const accountLocked = Boolean(
    !props.preferredStudyId &&
      entitlements &&
      !entitlements.hasPro &&
      !entitlements.hasAnyStudyPass,
  );

  if (exactStudyLocked || accountLocked) {
    return (
      <section className="overflow-hidden rounded-[26px] border border-violet-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,.08)]">
        <div className="border-b border-violet-100 bg-violet-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-violet-700">Plan feature</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">Follow-up assessments require Study Pass or Pro</h2>
        </div>
        <div className="p-6">
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Free studies can be designed and tested without follow-up delivery. To configure follow-up waves, participant invitations and reminder emails, add a Study Pass to this study or upgrade the researcher account to Pro Monthly / Pro Annual.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={props.onBack} className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
              Back to Study Builder
            </button>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-semibold text-violet-800">
              Open Plans & Billing to upgrade
            </span>
          </div>
        </div>
      </section>
    );
  }

  const Manager = BaseFollowupManager as any;
  return (
    <div className="space-y-4">
      {entitlements && !entitlements.hasPro && entitlements.hasAnyStudyPass && !props.preferredStudyId && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
          Your account has {entitlements.studyPassCount} Study Pass{entitlements.studyPassCount === 1 ? "" : "es"}. Follow-up access is checked separately for the study you select.
        </div>
      )}
      <Manager {...props} />
    </div>
  );
}
