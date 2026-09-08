export const RAZORPAY_PRODUCTS = {
  study_pass: {
    code: "study_pass",
    name: "Study Pass",
    amount: 49900,
    currency: "INR",
  },
} as const;

export type RazorpayProductCode = keyof typeof RAZORPAY_PRODUCTS;
