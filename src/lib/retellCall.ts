import { normalizeTranscript, type TranscriptLine } from "./callFormat.ts";

export type CallJob = { id: string; title: string; location: string; pay: string };
export type CallCandidate = { name: string; email: string };

export type WebCallResult =
  | { ok: true; callId: string; accessToken: string }
  | { ok: false; status: number; error: string };

// The voice agent's prompt references these as {{job_title}} etc. Values must be strings.
// Jobs have no schedule field yet, so the agent is told it is flexible.
export function buildCallVariables(job: CallJob, candidate: CallCandidate): Record<string, string> {
  return {
    job_id: job.id,
    job_title: job.title,
    job_location: job.location,
    job_pay: job.pay,
    job_schedule: "Flexible",
    candidate_name: candidate.name,
    candidate_first_name: candidate.name.split(/\s+/)[0],
    candidate_email: candidate.email,
  };
}

// Asks the NextGen platform to create a browser call on its public voice agent. The platform answers
// with a short-lived access token; the browser never talks to the platform directly.
export async function createWebCall(
  input: { baseUrl: string; agentId: string; variables: Record<string, string> },
  fetchFn: typeof fetch = fetch,
): Promise<WebCallResult> {
  const url = `${input.baseUrl.replace(/\/+$/, "")}/api/public/agents/${encodeURIComponent(input.agentId)}/web-call`;

  let res: Response;
  try {
    res = await fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Lets a free ngrok tunnel through its interstitial; ignored by any other host.
        "ngrok-skip-browser-warning": "1",
      },
      body: JSON.stringify({ dynamicVariables: input.variables }),
    });
  } catch {
    return { ok: false, status: 502, error: "Could not reach the voice service" };
  }

  if (res.status === 404) return { ok: false, status: 404, error: "Voice agent is not enabled" };
  if (res.status === 429) return { ok: false, status: 429, error: "Rate limited" };

  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, status: 502, error: `Voice service rejected the call (${res.status})` };
  if (typeof data?.call_id !== "string" || typeof data?.access_token !== "string") {
    return { ok: false, status: 502, error: "Voice service returned an unexpected answer" };
  }
  return { ok: true, callId: data.call_id, accessToken: data.access_token };
}

// Fallback while the platform's public web-call endpoint is not deployed: create the call on Retell
// directly. The agent still belongs to the platform, so its Retell webhook still logs the call there.
export async function createRetellWebCall(
  input: { apiKey: string; agentId: string; variables: Record<string, string> },
  fetchFn: typeof fetch = fetch,
): Promise<WebCallResult> {
  let res: Response;
  try {
    res = await fetchFn("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: { Authorization: `Bearer ${input.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: input.agentId,
        retell_llm_dynamic_variables: input.variables,
        // Retell echoes metadata on its webhooks, so the call can be tied back to the job and candidate.
        metadata: {
          source: "courierboard",
          job_id: input.variables.job_id,
          candidate_name: input.variables.candidate_name,
          candidate_email: input.variables.candidate_email,
        },
      }),
    });
  } catch {
    return { ok: false, status: 502, error: "Could not reach the voice service" };
  }

  if (res.status === 429) return { ok: false, status: 429, error: "Rate limited" };

  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, status: 502, error: `Voice service rejected the call (${res.status})` };
  if (typeof data?.call_id !== "string" || typeof data?.access_token !== "string") {
    return { ok: false, status: 502, error: "Voice service returned an unexpected answer" };
  }
  return { ok: true, callId: data.call_id, accessToken: data.access_token };
}

export type CallTranscriptResult =
  | { ok: true; ready: boolean; transcript: TranscriptLine[] }
  | { ok: false; status: number; error: string };

// The live `update` event may carry only the latest lines; Retell's stored call has the whole
// transcript. Calls on other agents in the same Retell account are reported as not found.
export async function getCallTranscript(
  input: { apiKey: string; callId: string; agentIds: string[] },
  fetchFn: typeof fetch = fetch,
): Promise<CallTranscriptResult> {
  let res: Response;
  try {
    res = await fetchFn(`https://api.retellai.com/v2/get-call/${encodeURIComponent(input.callId)}`, {
      headers: { Authorization: `Bearer ${input.apiKey}` },
    });
  } catch {
    return { ok: false, status: 502, error: "Could not reach the voice service" };
  }

  const notFound = { ok: false, status: 404, error: "Call not found" } as const;
  if (res.status === 404) return notFound;
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) return { ok: false, status: 502, error: `Voice service rejected the request (${res.status})` };
  if (!input.agentIds.includes(data.agent_id)) return notFound;

  const transcript = normalizeTranscript({ transcript: data.transcript_object });
  if (data.call_status !== "ended" || transcript.length === 0) return { ok: true, ready: false, transcript: [] };
  return { ok: true, ready: true, transcript };
}
