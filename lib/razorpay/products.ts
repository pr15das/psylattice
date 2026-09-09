export const RAZORPAY_PRODUCTS = {
  study_pass: {
    code: "study_pass",
    name: "Study Pass",
    amount: 49900,
    currency: "INR",
  },
  pro_monthly: {
    code: "pro_monthly",
    name: "PsyLattice Pro Monthly",
    amount: 74900,
    currency: "INR",
    billing_period: "monthly",
    plan_id: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID,
  },
  pro_annual: {
    code: "pro_annual",
    name: "PsyLattice Pro Annual",
    amount: 749900,
    currency: "INR",
    billing_period: "yearly",
    plan_id: process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID,
  },
} as const;

export type RazorpayProductCode = keyof typeof RAZORPAY_PRODUCTS;
