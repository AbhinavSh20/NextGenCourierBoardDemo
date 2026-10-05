import { completeInterview } from "@/lib/interviewComplete";
import { parseCompleteRequest } from "@/lib/interviewSession";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const allowComplete = createRateLimiter({ max: 20, windowMs: 10 * 60_000 });

// Tells the platform's Angie agent that a candidate's screening call has finished.
// Public, so the browser sends only the call id; identity is read back from Retell (see completeInterview).
export async function POST(req: Request) {
  const parsed = parseCompleteRequest(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const apiKey = process.env.RETELL_API_KEY;
  const agentId = process.env.RETELL_AGENT_ID;
  const baseUrl = process.env.PLATFORM_BASE_URL;
  const platformAgentId = process.env.PLATFORM_AGENT_ID;
  const secret = process.env.PLATFORM_INVOKE_SECRET;
  if (!apiKey || !agentId || !baseUrl || !platformAgentId || !secret) {
    return Response.json({ error: "Call follow-up is not configured" }, { status: 501 });
  }

  if (!allowComplete(clientKey(req))) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const result = await completeInterview({
    callId: parsed.value.callId,
    retell: { apiKey, agentId },
    platform: { baseUrl, agentId: platformAgentId, secret },
  });
  if (!result.ok) {
    if (result.status === 502) console.error("[api/interview/complete]", result.error);
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true });
}
