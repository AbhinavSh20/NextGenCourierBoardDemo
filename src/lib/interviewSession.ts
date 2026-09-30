export type InterviewRequest = { jobId: string; name: string; email: string };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function field(body: Record<string, unknown>, key: string, max: number): string | null {
  const v = body[key];
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.length <= max ? t : null;
}

export function parseInterviewRequest(
  body: unknown,
): { ok: true; value: InterviewRequest } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const b = body as Record<string, unknown>;
  const jobId = field(b, "jobId", 100);
  if (!jobId) return { ok: false, error: "jobId is required" };
  const name = field(b, "name", 100);
  if (!name) return { ok: false, error: "name is required" };
  const email = field(b, "email", 200);
  if (!email || !EMAIL.test(email)) return { ok: false, error: "a valid email is required" };
  return { ok: true, value: { jobId, name, email } };
}

export function buildInterviewUrl(base: string, params: Record<string, string>): string | null {
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.href;
}
