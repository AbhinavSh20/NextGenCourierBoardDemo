import { parseInterviewRequest } from "@/lib/interviewSession";
import { listJobs } from "@/lib/jobs";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";
import { buildCallVariables, createWebCall } from "@/lib/retellCall";

// Each call costs voice minutes and this endpoint is public, so cap how often one address can start one.
const allowCall = createRateLimiter({ max: 5, windowMs: 10 * 60_000 });

// Starts a Retell browser call for the Angie voice agent. The browser gets only the short-lived
// access token; RETELL_API_KEY never leaves the server.
export async function POST(req: Request) {
  const parsed = parseInterviewRequest(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const apiKey = process.env.RETELL_API_KEY;
  const agentId = process.env.RETELL_AGENT_ID;
  if (!apiKey || !agentId) return Response.json({ error: "Voice interview is not configured" }, { status: 501 });

  if (!allowCall(clientKey(req))) {
    return Response.json({ error: "Too many call attempts. Try again in a few minutes." }, { status: 429 });
  }

  try {
    const job = (await listJobs()).find((j) => j.id === parsed.value.jobId);
    if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

    const result = await createWebCall({
      apiKey,
      agentId,
      variables: buildCallVariables(job, parsed.value),
    });
    if (!result.ok) {
      console.error("[api/interview/session]", result.status, result.error);
      return Response.json({ error: "Could not start the call" }, { status: 502 });
    }
    return Response.json({ accessToken: result.accessToken, callId: result.callId });
  } catch (err) {
    console.error("[api/interview/session]", err);
    return Response.json({ error: "Failed to start voice interview" }, { status: 500 });
  }
}
