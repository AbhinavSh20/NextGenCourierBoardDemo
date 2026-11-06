export type CallJob = { id: string; title: string; location: string; pay: string };
export type CallCandidate = { name: string; email: string };

export type IceServer = { urls: string | string[]; username?: string; credential?: string };

// Everything the browser SDK needs to join the call. Retell's v3 API can issue LiveKit or gateway
// tokens, and the two look alike, so transport must be passed on rather than left to the SDK's default.
export type WebCallConnection = {
  callId: string;
  accessToken: string;
  transport?: "livekit" | "gateway";
  iceServers?: IceServer[];
};

export type WebCallResult =
  | ({ ok: true } & WebCallConnection)
  | { ok: false; status: number; error: string };

function readConnection(data: { call_id: string; access_token: string; transport?: unknown; ice_servers?: unknown }): WebCallConnection {
  return {
    callId: data.call_id,
    accessToken: data.access_token,
    ...(data.transport === "livekit" || data.transport === "gateway" ? { transport: data.transport } : {}),
    ...(Array.isArray(data.ice_servers) ? { iceServers: data.ice_servers as IceServer[] } : {}),
  };
}

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
  return { ok: true, ...readConnection(data) };
}

// Fallback while the platform's public web-call endpoint is not deployed: create the call on Retell
// directly. The agent still belongs to the platform, so its Retell webhook still logs the call there.
export async function createRetellWebCall(
  input: { apiKey: string; agentId: string; variables: Record<string, string> },
  fetchFn: typeof fetch = fetch,
): Promise<WebCallResult> {
  let res: Response;
  try {
    res = await fetchFn("https://api.retellai.com/v3/create-web-call", {
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
  return { ok: true, ...readConnection(data) };
}
