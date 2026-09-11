import { NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireAdmin();
    const admin = billingAdmin();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [directoryResult, transactionResult, failedResult, recentPaymentsResult, auditResult] = await Promise.all([
      admin
        .from("psylattice_admin_account_directory")
        .select("user_id, effective_plan, active_studies, successful_payments, total_paid_paise"),
      admin
        .from("psylattice_billing_transactions")
        .select("status, amount_paise, paid_at, created_at"),
      admin
        .from("research_billing_purchases")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed"),
      admin
        .from("psylattice_billing_transactions")
        .select("id, user_id, source, description, status, amount_paise, currency, razorpay_payment_id, razorpay_order_id, razorpay_subscription_id, razorpay_invoice_id, paid_at, created_at")
        .order("paid_at", { ascending: false, nullsFirst: false })
        .limit(8),
      admin
        .from("psylattice_admin_audit_log")
        .select("id, actor_user_id, actor_role, action, target_user_id, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (directoryResult.error) throw directoryResult.error;
    if (transactionResult.error) throw transactionResult.error;
    if (failedResult.error) throw failedResult.error;
    if (recentPaymentsResult.error) throw recentPaymentsResult.error;
    if (auditResult.error) throw auditResult.error;

    const directory = directoryResult.data || [];
    const payments = (transactionResult.data || []).filter((row) => row.status === "paid");
    const paid30 = payments.filter((row) => {
      const at = row.paid_at || row.created_at;
      return at && at >= thirtyDaysAgo;
    });

    const planCount = (plan: string) => directory.filter((row) => row.effective_plan === plan).length;
    const paidAccountCount = directory.filter((row) => row.effective_plan !== "free").length;

    const userIds = Array.from(new Set((recentPaymentsResult.data || []).map((row) => row.user_id).filter(Boolean)));
    const { data: recentUsers, error: recentUsersError } = userIds.length
      ? await admin
          .from("psylattice_admin_account_directory")
          .select("user_id, email, full_name")
          .in("user_id", userIds)
      : { data: [], error: null };
    if (recentUsersError) throw recentUsersError;
    const userMap = new Map((recentUsers || []).map((row) => [row.user_id, row]));

    return NextResponse.json(
      {
        ok: true,
        admin: session,
        metrics: {
          totalAccounts: directory.length,
          freeAccounts: planCount("free"),
          studyPassAccounts: planCount("study-pass"),
          proMonthlyAccounts: planCount("pro-monthly"),
          proAnnualAccounts: planCount("pro-annual"),
          payingAccounts: paidAccountCount,
          activeStudies: directory.reduce((sum, row) => sum + Number(row.active_studies || 0), 0),
          successfulPayments: payments.length,
          failedPayments: Math.max(0, Number(failedResult.count || 0)),
          lifetimeRevenuePaise: payments.reduce((sum, row) => sum + Number(row.amount_paise || 0), 0),
          revenue30dPaise: paid30.reduce((sum, row) => sum + Number(row.amount_paise || 0), 0),
        },
        recentPayments: (recentPaymentsResult.data || []).map((row) => ({
          ...row,
          user: row.user_id ? userMap.get(row.user_id) || null : null,
        })),
        recentAudit: auditResult.data || [],
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin overview failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
