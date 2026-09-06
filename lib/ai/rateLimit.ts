type RateLimitRule = {
  limit: number;
  windowMs: number;
};

type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export const AI_RATE_LIMITS = {
  guide: { limit: 30, windowMs: 10 * 60 * 1000 },
  mobileGuide: { limit: 40, windowMs: 10 * 60 * 1000 },
  research: { limit: 12, windowMs: 10 * 60 * 1000 },
  writing: { limit: 8, windowMs: 10 * 60 * 1000 },
  analysis: { limit: 8, windowMs: 10 * 60 * 1000 },
} satisfies Record<string, RateLimitRule>;

export function consumeAiRateLimit(
  route: keyof typeof AI_RATE_LIMITS,
  userId: string
) {
  try {
    const now = Date.now();
    const rule = AI_RATE_LIMITS[route];
    const key = `${route}:${userId}`;
    const existing = buckets.get(key);
    const timestamps = (existing?.timestamps || []).filter(
      (timestamp) => now - timestamp < rule.windowMs
    );

    if (timestamps.length >= rule.limit) {
      buckets.set(key, { timestamps });
      return false;
    }

    timestamps.push(now);
    buckets.set(key, { timestamps });

    if (buckets.size > MAX_BUCKETS) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.timestamps.every((timestamp) => now - timestamp >= rule.windowMs)) {
          buckets.delete(bucketKey);
        }
        if (buckets.size <= MAX_BUCKETS) break;
      }
    }

    return true;
  } catch {
    // Rate limiting must not take down legitimate AI requests if local
    // bookkeeping ever fails. Distributed enforcement requires infrastructure.
    return true;
  }
}

export function aiRateLimitResponse() {
  return Response.json(
    { error: "Too many AI requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": "600",
      },
    }
  );
}
