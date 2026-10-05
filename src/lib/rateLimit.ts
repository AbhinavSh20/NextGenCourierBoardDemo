// In-memory sliding window. Per server instance only: enough to stop a casual loop from burning
// voice minutes on a demo; not a substitute for a shared limiter if this ever runs on many instances.
export function createRateLimiter(
  { max, windowMs }: { max: number; windowMs: number },
  now: () => number = Date.now,
) {
  const hits = new Map<string, number[]>();

  return function allow(key: string): boolean {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((at) => t - at < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return false;
    }
    recent.push(t);
    hits.set(key, recent);
    return true;
  };
}

export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
