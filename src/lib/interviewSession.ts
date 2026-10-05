export type InterviewRequest = { jobId: string; name: string; email: string };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type CompleteRequest = { callId: string };

// The id goes into a Retell URL path, so only plain id characters are allowed.
export function parseCompleteRequest(
  body: unknown,
): { ok: true; value: CompleteRequest } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const callId = (body as Record<string, unknown>).callId;
  if (typeof callId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(callId)) {
    return { ok: false, error: "a valid callId is required" };
  }
  return { ok: true, value: { callId } };
}

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
