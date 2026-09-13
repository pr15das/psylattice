type Rule = { limit: number; windowMs: number };
type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5_000;

export const MOBILE_RATE_LIMITS = {
  resolveJoin: { limit: 30, windowMs: 10 * 60 * 1000 },
  join: { limit: 12, windowMs: 10 * 60 * 1000 },
  devices: { limit: 60, windowMs: 10 * 60 * 1000 },
  notifications: { limit: 300, windowMs: 10 * 60 * 1000 },
} satisfies Record<string, Rule>;

export function consumeMobileRateLimit(
  scope: keyof typeof MOBILE_RATE_LIMITS,
  userId: string
) {
  const now = Date.now();
  const rule = MOBILE_RATE_LIMITS[scope];
  const key = `${scope}:${userId}`;
  const timestamps = (buckets.get(key)?.timestamps || []).filter(
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
}
