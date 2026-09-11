import "server-only";

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  RESEARCH_PLAN_DEFINITIONS,
  type ResearchPlanTier,
} from "@/lib/billing/plans";
import { getPublicAiBudgetSnapshot } from "@/lib/billing/ai";
import { getPublicResourceBudgetSnapshot } from "@/lib/billing/resources";

export type BillingAccountRow = {
  user_id: string;
  plan_tier: "free" | "pro-monthly" | "pro-annual";
  plan_status: string;
  razorpay_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  ai_bonus_units: number;
  email_bonus: number;
  media_bonus_bytes: number;
};

export type StudyEntitlementRow = {
  user_id: string;
  study_id: string;
  study_pass_active: boolean;
  participant_bonus: number;
};

export type ResearcherEntitlements = {
  plan: ResearchPlanTier;
  planName: string;
  planStatus: string;
  hasPro: boolean;
  hasAnyStudyPass: boolean;
  studyPassCount: number;
  selectedStudyHasPass: boolean;
  studyId: string | null;
  subscription: {
    razorpaySubscriptionId: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  };
  studies: {
    maxSimultaneous: number;
    activeCount: number;
    remainingActiveSlots: number;
  };
  participants: {
    includedPerStudy: number;
    purchasedExtraForSelectedStudy: number;
    effectiveLimitForSelectedStudy: number;
    currentForSelectedStudy: number;
    remainingForSelectedStudy: number;
    canBuyExpansionForSelectedStudy: boolean;
  };
  ai: {
    allowanceLabel: "Starter" | "Standard" | "High" | "Extended";
    modelAccess: "auto-only" | "selected" | "full";
    remainingPercent: number | null;
  };
  media: {
    uploadsAllowed: boolean;
    includedBytes: number;
    purchasedExtraBytes: number;
    effectiveStorageBytes: number;
    usedBytes: number;
    remainingBytes: number;
    remainingPercent: number;
  };
  participantEmails: {
    included: number;
    purchasedExtra: number;
    effectiveAllowance: number;
    used: number;
    remaining: number;
    remainingPercent: number;
  };
  marketplace: {
    canBuyAddons: boolean;
    canBuyMediaStorage: boolean;
  };
};

export function billingAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Billing database environment variables are incomplete.");
  }

  return createSupabaseAdmin(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function authenticatedBillingUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

/**
 * Safety net in addition to the auth.users trigger in the SQL migration.
 * ignoreDuplicates=true is important: this must NEVER overwrite a paid account.
 */
export async function ensureBillingAccount(userId: string) {
  const admin = billingAdmin();
  const { error } = await admin.from("research_billing_accounts").upsert(
    {
      user_id: userId,
      plan_tier: "free",
      plan_status: "active",
    },
    {
      onConflict: "user_id",
      ignoreDuplicates: true,
    },
  );

  if (error) throw error;
}

export function accountHasCurrentPro(account: BillingAccountRow | null | undefined) {
  if (!account) return false;
  if (account.plan_tier !== "pro-monthly" && account.plan_tier !== "pro-annual") {
    return false;
  }

  if (["active", "authenticated", "pending"].includes(account.plan_status)) {
    return true;
  }

  if (
    ["cancelled", "completed"].includes(account.plan_status) &&
    account.current_period_end &&
    new Date(account.current_period_end).getTime() > Date.now()
  ) {
    return true;
  }

  return false;
}

async function assertOwnedStudy(userId: string, studyId: string) {
  const admin = billingAdmin();
  const { data, error } = await admin
    .from("research_studies")
    .select("id, title, status")
    .eq("id", studyId)
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("The selected study does not belong to this researcher account.");
  }

  return data;
}

async function loadAccountAndStudyEntitlements(userId: string, studyId?: string | null) {
  await ensureBillingAccount(userId);
  const admin = billingAdmin();

  if (studyId) {
    await assertOwnedStudy(userId, studyId);
  }

  const accountPromise = admin
    .from("research_billing_accounts")
    .select(
      "user_id, plan_tier, plan_status, razorpay_subscription_id, current_period_start, current_period_end, ai_bonus_units, email_bonus, media_bonus_bytes",
    )
    .eq("user_id", userId)
    .maybeSingle();

  const studyPassCountPromise = admin
    .from("research_study_entitlements")
    .select("study_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("study_pass_active", true);

  const selectedStudyPromise = studyId
    ? admin
        .from("research_study_entitlements")
        .select("user_id, study_id, study_pass_active, participant_bonus")
        .eq("user_id", userId)
        .eq("study_id", studyId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const activeStudyCountPromise = admin
    .from("research_studies")
    .select("id", { count: "exact", head: true })
    .eq("owner_user_id", userId)
    .eq("status", "active");

  const selectedParticipantCountPromise = studyId
    ? admin
        .from("study_participants")
        .select("id", { count: "exact", head: true })
        .eq("study_id", studyId)
        .eq("is_test", false)
        .neq("status", "withdrawn")
    : Promise.resolve({ count: 0, error: null });

  const [
    accountResult,
    studyPassCountResult,
    selectedStudyResult,
    activeStudyCountResult,
    selectedParticipantCountResult,
  ] = await Promise.all([
    accountPromise,
    studyPassCountPromise,
    selectedStudyPromise,
    activeStudyCountPromise,
    selectedParticipantCountPromise,
  ]);

  if (accountResult.error) throw accountResult.error;
  if (studyPassCountResult.error) throw studyPassCountResult.error;
  if (selectedStudyResult.error) throw selectedStudyResult.error;
  if (activeStudyCountResult.error) throw activeStudyCountResult.error;
  if (selectedParticipantCountResult.error) throw selectedParticipantCountResult.error;

  return {
    account: (accountResult.data || null) as BillingAccountRow | null,
    studyPassCount: Math.max(0, Number(studyPassCountResult.count || 0)),
    hasAnyStudyPass: Math.max(0, Number(studyPassCountResult.count || 0)) > 0,
    selectedStudyEntitlement: (selectedStudyResult.data || null) as StudyEntitlementRow | null,
    activeStudyCount: Math.max(0, Number(activeStudyCountResult.count || 0)),
    selectedParticipantCount: Math.max(
      0,
      Number(selectedParticipantCountResult.count || 0),
    ),
  };
}

export async function getResearcherEntitlements(
  userId: string,
  studyId?: string | null,
): Promise<ResearcherEntitlements> {
  const {
    account,
    hasAnyStudyPass,
    studyPassCount,
    selectedStudyEntitlement,
    activeStudyCount,
    selectedParticipantCount,
  } = await loadAccountAndStudyEntitlements(userId, studyId);

  const hasPro = accountHasCurrentPro(account);
  const selectedStudyHasPass = selectedStudyEntitlement?.study_pass_active === true;

  // With a selected study, Study Pass only applies to that exact study.
  // Without a selected study, the account summary can say Study Pass when the
  // researcher owns at least one active pass.
  const plan: ResearchPlanTier = hasPro
    ? (account!.plan_tier as "pro-monthly" | "pro-annual")
    : studyId
      ? selectedStudyHasPass
        ? "study-pass"
        : "free"
      : hasAnyStudyPass
        ? "study-pass"
        : "free";

  const definition = RESEARCH_PLAN_DEFINITIONS[plan];
  const participantBonus = Math.max(
    0,
    Number(selectedStudyEntitlement?.participant_bonus || 0),
  );
  const hasPaidAccess = hasPro || hasAnyStudyPass;
  const canBuyExpansionForSelectedStudy = hasPro || selectedStudyHasPass;
  const effectiveParticipantLimit = definition.participantsPerStudy + participantBonus;
  const [aiBudget, resourceBudget] = await Promise.all([
    getPublicAiBudgetSnapshot(userId),
    getPublicResourceBudgetSnapshot(userId, studyId),
  ]);

  return {
    plan,
    planName: definition.name,
    planStatus: account?.plan_status || "active",
    hasPro,
    hasAnyStudyPass,
    studyPassCount: Math.max(studyPassCount, resourceBudget.studyPassCount),
    selectedStudyHasPass,
    studyId: studyId || null,
    subscription: {
      razorpaySubscriptionId: account?.razorpay_subscription_id || null,
      currentPeriodStart: account?.current_period_start || null,
      currentPeriodEnd: account?.current_period_end || null,
    },
    studies: {
      maxSimultaneous: definition.maxSimultaneousStudies,
      activeCount: activeStudyCount,
      remainingActiveSlots: Math.max(
        0,
        definition.maxSimultaneousStudies - activeStudyCount,
      ),
    },
    participants: {
      includedPerStudy: definition.participantsPerStudy,
      purchasedExtraForSelectedStudy: participantBonus,
      effectiveLimitForSelectedStudy: effectiveParticipantLimit,
      currentForSelectedStudy: selectedParticipantCount,
      remainingForSelectedStudy: Math.max(
        0,
        effectiveParticipantLimit - selectedParticipantCount,
      ),
      canBuyExpansionForSelectedStudy,
    },
    ai: {
      allowanceLabel: definition.aiAllowanceLabel,
      modelAccess: definition.aiModelAccess,
      // Only the customer-safe percentage leaves the server. Hidden units stay
      // inside service-role-only billing tables/RPCs.
      remainingPercent: aiBudget.remainingPercent,
    },
    media: {
      uploadsAllowed: resourceBudget.media.uploadsAllowed,
      includedBytes: resourceBudget.media.includedBytes,
      purchasedExtraBytes: resourceBudget.media.purchasedExtraBytes,
      effectiveStorageBytes: resourceBudget.media.effectiveStorageBytes,
      usedBytes: resourceBudget.media.usedBytes,
      remainingBytes: resourceBudget.media.remainingBytes,
      remainingPercent: resourceBudget.media.remainingPercent,
    },
    participantEmails: {
      included: resourceBudget.participantEmails.included,
      purchasedExtra: resourceBudget.participantEmails.purchasedExtra,
      effectiveAllowance: resourceBudget.participantEmails.effectiveAllowance,
      used: resourceBudget.participantEmails.used,
      remaining: resourceBudget.participantEmails.remaining,
      remainingPercent: resourceBudget.participantEmails.remainingPercent,
    },
    marketplace: {
      // Account-level AI/email add-ons become available after any paid access.
      canBuyAddons: hasPaidAccess,
      canBuyMediaStorage: hasPro,
    },
  };
}

/**
 * Compatibility snapshot for the existing Razorpay marketplace routes.
 * The actual plan calculation is delegated to getResearcherEntitlements().
 */
export async function loadBillingSnapshot(userId: string) {
  const entitlements = await getResearcherEntitlements(userId);
  const admin = billingAdmin();

  const { data: account, error } = await admin
    .from("research_billing_accounts")
    .select(
      "user_id, plan_tier, plan_status, razorpay_subscription_id, current_period_start, current_period_end, ai_bonus_units, email_bonus, media_bonus_bytes",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return {
    account: (account || null) as BillingAccountRow | null,
    hasPro: entitlements.hasPro,
    hasStudyPass: entitlements.hasAnyStudyPass,
    effectivePlan: entitlements.plan,
    entitlements,
  };
}

export async function userOwnsStudy(userId: string, studyId: string) {
  return assertOwnedStudy(userId, studyId);
}

export async function studyHasPass(userId: string, studyId: string) {
  const entitlements = await getResearcherEntitlements(userId, studyId);
  return entitlements.selectedStudyHasPass;
}
