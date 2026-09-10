import "server-only";

export type MarketplaceProductId =
  | "study-pass"
  | "pro-monthly"
  | "pro-annual"
  | "ai-starter"
  | "ai-research"
  | "ai-power"
  | "participants-100"
  | "participants-200"
  | "participants-500"
  | "email-1000"
  | "email-5000"
  | "email-15000"
  | "storage-5gb"
  | "storage-20gb"
  | "storage-50gb";

export type MarketplaceCategory =
  | "plan"
  | "ai"
  | "participants"
  | "email"
  | "storage";

export type MarketplaceRequirement = "none" | "paid" | "pro";
export type MarketplaceScope = "account" | "study";

export type MarketplaceServerProduct = {
  id: MarketplaceProductId;
  name: string;
  category: MarketplaceCategory;
  amountPaise: number;
  requirement: MarketplaceRequirement;
  scope: MarketplaceScope;
  recurring?: "monthly" | "yearly";
  razorpayPlanEnv?: "RAZORPAY_PRO_MONTHLY_PLAN_ID" | "RAZORPAY_PRO_ANNUAL_PLAN_ID";
};

export const MARKETPLACE_PRODUCTS: Record<MarketplaceProductId, MarketplaceServerProduct> = {
  "study-pass": {
    id: "study-pass",
    name: "Study Pass",
    category: "plan",
    amountPaise: 49_900,
    requirement: "none",
    scope: "study",
  },
  "pro-monthly": {
    id: "pro-monthly",
    name: "Pro Monthly",
    category: "plan",
    amountPaise: 74_900,
    requirement: "none",
    scope: "account",
    recurring: "monthly",
    razorpayPlanEnv: "RAZORPAY_PRO_MONTHLY_PLAN_ID",
  },
  "pro-annual": {
    id: "pro-annual",
    name: "Pro Annual",
    category: "plan",
    amountPaise: 749_900,
    requirement: "none",
    scope: "account",
    recurring: "yearly",
    razorpayPlanEnv: "RAZORPAY_PRO_ANNUAL_PLAN_ID",
  },
  "ai-starter": {
    id: "ai-starter",
    name: "Starter Boost",
    category: "ai",
    amountPaise: 9_900,
    requirement: "paid",
    scope: "account",
  },
  "ai-research": {
    id: "ai-research",
    name: "Research Boost",
    category: "ai",
    amountPaise: 24_900,
    requirement: "paid",
    scope: "account",
  },
  "ai-power": {
    id: "ai-power",
    name: "Power Boost",
    category: "ai",
    amountPaise: 49_900,
    requirement: "paid",
    scope: "account",
  },
  "participants-100": {
    id: "participants-100",
    name: "+100 participants",
    category: "participants",
    amountPaise: 14_900,
    requirement: "paid",
    scope: "study",
  },
  "participants-200": {
    id: "participants-200",
    name: "+200 participants",
    category: "participants",
    amountPaise: 24_900,
    requirement: "paid",
    scope: "study",
  },
  "participants-500": {
    id: "participants-500",
    name: "+500 participants",
    category: "participants",
    amountPaise: 49_900,
    requirement: "paid",
    scope: "study",
  },
  "email-1000": {
    id: "email-1000",
    name: "+1,000 participant emails",
    category: "email",
    amountPaise: 4_900,
    requirement: "paid",
    scope: "account",
  },
  "email-5000": {
    id: "email-5000",
    name: "+5,000 participant emails",
    category: "email",
    amountPaise: 14_900,
    requirement: "paid",
    scope: "account",
  },
  "email-15000": {
    id: "email-15000",
    name: "+15,000 participant emails",
    category: "email",
    amountPaise: 34_900,
    requirement: "paid",
    scope: "account",
  },
  "storage-5gb": {
    id: "storage-5gb",
    name: "+5 GB media storage",
    category: "storage",
    amountPaise: 9_900,
    requirement: "pro",
    scope: "account",
  },
  "storage-20gb": {
    id: "storage-20gb",
    name: "+20 GB media storage",
    category: "storage",
    amountPaise: 24_900,
    requirement: "pro",
    scope: "account",
  },
  "storage-50gb": {
    id: "storage-50gb",
    name: "+50 GB media storage",
    category: "storage",
    amountPaise: 49_900,
    requirement: "pro",
    scope: "account",
  },
};

export function isMarketplaceProductId(value: unknown): value is MarketplaceProductId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(MARKETPLACE_PRODUCTS, value);
}

export function marketplaceProduct(id: MarketplaceProductId) {
  return MARKETPLACE_PRODUCTS[id];
}

export function isRecurringPlan(id: MarketplaceProductId) {
  return id === "pro-monthly" || id === "pro-annual";
}

export function hiddenGrantForProduct(id: MarketplaceProductId) {
  switch (id) {
    case "ai-starter":
      return { aiUnits: 75 };
    case "ai-research":
      return { aiUnits: 200 };
    case "ai-power":
      return { aiUnits: 500 };
    case "participants-100":
      return { participants: 100 };
    case "participants-200":
      return { participants: 200 };
    case "participants-500":
      return { participants: 500 };
    case "email-1000":
      return { emails: 1_000 };
    case "email-5000":
      return { emails: 5_000 };
    case "email-15000":
      return { emails: 15_000 };
    case "storage-5gb":
      return { storageBytes: 5 * 1024 ** 3 };
    case "storage-20gb":
      return { storageBytes: 20 * 1024 ** 3 };
    case "storage-50gb":
      return { storageBytes: 50 * 1024 ** 3 };
    default:
      return {};
  }
}
