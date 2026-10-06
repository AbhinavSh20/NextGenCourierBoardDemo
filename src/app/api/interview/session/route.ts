import { parseInterviewRequest } from "@/lib/interviewSession";
import { listJobs } from "@/lib/jobs";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";
import { buildCallVariables, createRetellWebCall, createWebCall, type WebCallResult } from "@/lib/retellCall";

// The platform rate-limits calls too, but that limit is shared by every visitor; this one stops a loop
// on the public page from using it all up.
const allowCall = createRateLimiter({ max: 5, windowMs: 10 * 60_000 });

// Starts a screening call on the NextGen platform's voice agent. The browser gets only the short-lived
// access token; the platform is only ever called from here.
export async function POST(req: Request) {
  const parsed = parseInterviewRequest(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  // The platform's public endpoint when it is configured; otherwise Retell directly (see createRetellWebCall).
  const platformUrl = process.env.PLATFORM_API_URL;
  const platformAgentId = process.env.VOICE_AGENT_ID;
  const retellKey = process.env.RETELL_API_KEY;
  const retellAgentId = process.env.RETELL_AGENT_ID;
  const usePlatform = Boolean(platformUrl && platformAgentId);
  if (!usePlatform && !(retellKey && retellAgentId)) {
    return Response.json({ error: "Voice interview is not configured" }, { status: 501 });
  }

  if (!allowCall(clientKey(req))) {
    return Response.json({ error: "Too many call attempts. Try again in a few minutes." }, { status: 429 });
  }

  try {
    const job = (await listJobs()).find((j) => j.id === parsed.value.jobId);
    if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

    const variables = buildCallVariables(job, parsed.value);
    const result: WebCallResult = usePlatform
      ? await createWebCall({ baseUrl: platformUrl!, agentId: platformAgentId!, variables })
      : await createRetellWebCall({ apiKey: retellKey!, agentId: retellAgentId!, variables });
    if (!result.ok) {
      if (result.status === 404) return Response.json({ error: "Voice interview is not available" }, { status: 501 });
      if (result.status === 429) {
        return Response.json({ error: "Too many call attempts. Try again in a few minutes." }, { status: 429 });
      }
      console.error("[api/interview/session]", result.status, result.error);
      return Response.json({ error: "Could not start the call" }, { status: 502 });
    }
    return Response.json({ accessToken: result.accessToken, callId: result.callId });
  } catch (err) {
    console.error("[api/interview/session]", err);
    return Response.json({ error: "Failed to start voice interview" }, { status: 500 });
  }
}
