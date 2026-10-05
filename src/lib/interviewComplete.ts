export type CompleteConfig = {
  callId: string;
  retell: { apiKey: string; agentId: string };
  platform: { baseUrl: string; agentId: string; secret: string };
};

export type CompleteResult =
  | { ok: true; executionId: string | null }
  | { ok: false; status: number; error: string };

const fail = (status: number, error: string): { ok: false; status: number; error: string } => ({
  ok: false,
  status,
  error,
});

// Called when a candidate's call ends. The browser only supplies the call id; everything else is read
// from Retell, so a forged request cannot make the platform agent act on an arbitrary candidate.
export async function completeInterview(
  { callId, retell, platform }: CompleteConfig,
  fetchFn: typeof fetch = fetch,
): Promise<CompleteResult> {
  let call: Record<string, unknown> | null;
  try {
    const res = await fetchFn(`https://api.retellai.com/v2/get-call/${callId}`, {
      headers: { Authorization: `Bearer ${retell.apiKey}` },
    });
    if (res.status === 404) return fail(404, "Call not found");
    if (!res.ok) return fail(502, "Could not read the call");
    call = await res.json().catch(() => null);
  } catch {
    return fail(502, "Could not reach the voice service");
  }
  if (!call) return fail(502, "Could not read the call");

  const metadata = (call.metadata ?? {}) as Record<string, unknown>;
  const email = metadata.candidate_email;
  if (call.agent_id !== retell.agentId || metadata.source !== "courierboard" || typeof email !== "string" || !email) {
    return fail(403, "Call is not part of this site");
  }
  if (call.call_status !== "ended") return fail(409, "Call has not ended yet");

  const name = typeof metadata.candidate_name === "string" ? metadata.candidate_name : "";
  const jobId = typeof metadata.job_id === "string" ? metadata.job_id : "";

  try {
    const res = await fetchFn(
      `${platform.baseUrl.replace(/\/+$/, "")}/api/agents/${encodeURIComponent(platform.agentId)}/invoke`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-agent-invoke-secret": platform.secret },
        body: JSON.stringify({
          message: `A candidate finished a screening call (candidate ${email}, job ${jobId}). Look up their screening result in the candidates sheet and report it.`,
          variables: { candidate_email: email, candidate_name: name, job_id: jobId, call_id: callId, source: "courierboard" },
          // A repeated end-of-call (retry, double event) must not start Angie twice.
          idempotencyKey: callId,
        }),
      },
    );
    if (!res.ok) return fail(502, `Platform rejected the request (${res.status})`);
    const data = await res.json().catch(() => null);
    return { ok: true, executionId: typeof data?.executionId === "string" ? data.executionId : null };
  } catch {
    return fail(502, "Could not reach the platform");
  }
}
