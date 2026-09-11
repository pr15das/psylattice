import { NextResponse } from "next/server";
import {
  authenticatedBillingUser,
  billingAdmin,
  getResearcherEntitlements,
} from "@/lib/billing/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function profileCompletion(profile: Record<string, unknown> | null) {
  if (!profile) return 0;

  const checks = [
    cleanText(profile.full_name),
    cleanText(profile.affiliation_type),
    cleanText(profile.designation),
    cleanText(profile.primary_field),
    cleanText(profile.country),
  ];

  const affiliation = cleanText(profile.affiliation_type);
  if (affiliation === "institution" || affiliation === "organisation") {
    checks.push(cleanText(profile.institution_name));
  }

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function planDisplayLabel(
  plan: string,
  hasPro: boolean,
  studyPassCount: number,
) {
  if (hasPro && plan === "pro-monthly") return "Pro Monthly";
  if (hasPro && plan === "pro-annual") return "Pro Annual";
  if (studyPassCount > 0) {
    return studyPassCount === 1 ? "Study Pass ×1" : `Study Pass ×${studyPassCount}`;
  }
  return "Free";
}

export async function GET() {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in again." },
        { status: 401 },
      );
    }

    const admin = billingAdmin();

    const [entitlements, profileResult, passResult, paidResult] = await Promise.all([
      getResearcherEntitlements(user.id),
      admin
        .from("profiles")
        .select(
          "id, full_name, age, gender, affiliation_type, institution_name, department, designation, student_level, primary_field, country, workspace_access, created_at, updated_at, profile_completed_at",
        )
        .eq("id", user.id)
        .maybeSingle(),
      admin
        .from("research_study_entitlements")
        .select("study_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("study_pass_active", true),
      admin
        .from("research_billing_purchases")
        .select("amount_paise, paid_at, created_at")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .order("paid_at", { ascending: false, nullsFirst: false })
        .limit(5000),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (passResult.error) throw passResult.error;
    if (paidResult.error) throw paidResult.error;

    const profile = (profileResult.data || null) as Record<string, unknown> | null;
    const paidRows = paidResult.data || [];
    const paymentCount = paidRows.length;
    const totalPaidPaise = paidRows.reduce(
      (sum, row) => sum + Math.max(0, Number(row.amount_paise || 0)),
      0,
    );
    const lastPaymentAt =
      paidRows[0]?.paid_at || paidRows[0]?.created_at || null;
    const studyPassCount = Math.max(0, Number(passResult.count || 0));

    return NextResponse.json(
      {
        ok: true,
        account: {
          id: user.id,
          email: user.email || "",
          emailVerified: Boolean(user.email_confirmed_at),
          createdAt: user.created_at || profile?.created_at || null,
          lastSignInAt: user.last_sign_in_at || null,
        },
        profile,
        profileCompletionPercent: profileCompletion(profile),
        billing: {
          planLabel: planDisplayLabel(
            entitlements.plan,
            entitlements.hasPro,
            studyPassCount,
          ),
          studyPassCount,
          paymentCount,
          totalPaidPaise,
          lastPaymentAt,
          entitlements,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Account summary failed:", error);
    return NextResponse.json(
      { ok: false, error: "PsyLattice could not load your account right now." },
      { status: 500 },
    );
  }
}
