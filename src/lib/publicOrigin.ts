const first = (v: string | null) => v?.split(",")[0].trim() ?? "";

// The origin callers can actually reach: behind a proxy or tunnel req.url shows the internal host.
export function publicOrigin(req: Request, configured = process.env.PUBLIC_BASE_URL): string {
  if (configured) return configured.replace(/\/+$/, "");

  const own = new URL(req.url);
  const host = first(req.headers.get("x-forwarded-host"));
  if (!/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return own.origin;

  const proto = first(req.headers.get("x-forwarded-proto"));
  return `${proto === "http" || proto === "https" ? proto : own.protocol.replace(":", "")}://${host}`;
}
