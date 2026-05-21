// Process-local rate limiter. Works for single-instance deploys (local dev, single Vercel function).
// Upgrade to Upstash (@upstash/ratelimit) before scaling to multi-instance production.

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

const counters = new Map<string, { count: number; windowStart: number }>();

export function checkRateLimit(key: string, limit: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = counters.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    counters.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}
