import { clientKey, createRateLimiter } from "@/lib/rateLimit";
import { getCallTranscript } from "@/lib/retellCall";

// The browser retries a few times while Retell finishes the transcript, so allow more than a call start.
const allowFetch = createRateLimiter({ max: 30, windowMs: 10 * 60_000 });

// Returns the full transcript of a finished screening call. The browser only knows its own call id
// (from /api/interview/session); the Retell key stays here.
export async function GET(req: Request) {
  const callId = new URL(req.url).searchParams.get("callId") ?? "";
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(callId)) return Response.json({ error: "Invalid call id" }, { status: 400 });

  const apiKey = process.env.RETELL_API_KEY;
  const agentIds = [process.env.RETELL_AGENT_ID, process.env.VOICE_AGENT_ID].filter((id): id is string => Boolean(id));
  if (!apiKey || agentIds.length === 0) return Response.json({ error: "Transcripts are not configured" }, { status: 501 });

  if (!allowFetch(clientKey(req))) return Response.json({ error: "Too many requests" }, { status: 429 });

  const result = await getCallTranscript({ apiKey, callId, agentIds });
  if (!result.ok) {
    if (result.status !== 404) console.error("[api/interview/transcript]", result.status, result.error);
    return Response.json({ error: result.status === 404 ? "Call not found" : "Could not load transcript" }, { status: result.status });
  }
  return Response.json({ ready: result.ready, transcript: result.transcript });
}
