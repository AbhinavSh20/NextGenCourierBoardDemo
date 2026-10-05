export type CallJob = { id: string; title: string; company: string; location: string; pay: string };
export type CallCandidate = { name: string; email: string };

export type WebCallResult =
  | { ok: true; callId: string; accessToken: string }
  | { ok: false; status: number; error: string };

const RETELL_CREATE_WEB_CALL = "https://api.retellai.com/v2/create-web-call";

// Retell dynamic variables must be strings. The agent prompt references them as {{job_title}} etc.
export function buildCallVariables(job: CallJob, candidate: CallCandidate): Record<string, string> {
  return {
    job_id: job.id,
    job_title: job.title,
    company: job.company,
    location: job.location,
    pay: job.pay,
    candidate_name: candidate.name,
    candidate_first_name: candidate.name.split(/\s+/)[0],
    candidate_email: candidate.email,
  };
}

export async function createWebCall(
  input: { apiKey: string; agentId: string; variables: Record<string, string> },
  fetchFn: typeof fetch = fetch,
): Promise<WebCallResult> {
  let res: Response;
  try {
    res = await fetchFn(RETELL_CREATE_WEB_CALL, {
      method: "POST",
      headers: { Authorization: `Bearer ${input.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: input.agentId,
        retell_llm_dynamic_variables: input.variables,
        // Retell echoes metadata on every webhook, so the call can be tied back to the job and candidate.
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

  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, status: res.status, error: `Voice service rejected the call (${res.status})` };
  if (typeof data?.call_id !== "string" || typeof data?.access_token !== "string") {
    return { ok: false, status: 502, error: "Voice service returned an unexpected answer" };
  }
  return { ok: true, callId: data.call_id, accessToken: data.access_token };
}
