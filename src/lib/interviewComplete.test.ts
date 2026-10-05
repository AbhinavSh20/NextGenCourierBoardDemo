import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { completeInterview } from "./interviewComplete.ts";

const config = {
  retell: { apiKey: "key_retell", agentId: "agent_voice" },
  platform: { baseUrl: "https://platform.example.com/", agentId: "angie_text_id", secret: "agtinv_secret" },
};

const endedCall = {
  call_id: "call_1",
  agent_id: "agent_voice",
  call_status: "ended",
  metadata: {
    source: "courierboard",
    job_id: "j1",
    candidate_name: "Maria Lopez",
    candidate_email: "maria@example.com",
  },
};

type Route = { match: (url: string) => boolean; status: number; body: unknown };

function fakeFetch(routes: Route[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchFn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const route = routes.find((r) => r.match(url));
    if (!route) throw new Error(`unexpected fetch ${url}`);
    return new Response(JSON.stringify(route.body), { status: route.status });
  }) as unknown as typeof fetch;
  return { fetchFn, calls };
}

const retellRoute = (body: unknown, status = 200): Route => ({
  match: (u) => u.startsWith("https://api.retellai.com/v2/get-call/"),
  status,
  body,
});
const platformRoute = (status = 202, body: unknown = { status: "accepted", executionId: "exec_1" }): Route => ({
  match: (u) => u.includes("/invoke"),
  status,
  body,
});

describe("completeInterview", () => {
  it("verifies the call with Retell, then invokes the platform agent", async () => {
    const { fetchFn, calls } = fakeFetch([retellRoute(endedCall), platformRoute()]);
    const out = await completeInterview({ callId: "call_1", ...config }, fetchFn);
    assert.deepEqual(out, { ok: true, executionId: "exec_1" });

    assert.equal(calls[0].url, "https://api.retellai.com/v2/get-call/call_1");
    assert.equal((calls[0].init.headers as Record<string, string>).Authorization, "Bearer key_retell");

    assert.equal(calls[1].url, "https://platform.example.com/api/agents/angie_text_id/invoke");
    const headers = calls[1].init.headers as Record<string, string>;
    assert.equal(headers["x-agent-invoke-secret"], "agtinv_secret");
    const body = JSON.parse(String(calls[1].init.body));
    assert.equal(body.idempotencyKey, "call_1");
    assert.equal(body.variables.candidate_email, "maria@example.com");
    assert.equal(body.variables.candidate_name, "Maria Lopez");
    assert.equal(body.variables.job_id, "j1");
    assert.equal(body.variables.call_id, "call_1");
    assert.ok(typeof body.message === "string" && body.message.includes("maria@example.com"));
  });

  it("treats a duplicate delivery (200) as success", async () => {
    const { fetchFn } = fakeFetch([retellRoute(endedCall), platformRoute(200, { status: "duplicate", executionId: "exec_1" })]);
    assert.equal((await completeInterview({ callId: "call_1", ...config }, fetchFn)).ok, true);
  });

  it("refuses a call that belongs to a different Retell agent", async () => {
    const { fetchFn, calls } = fakeFetch([retellRoute({ ...endedCall, agent_id: "someone_else" })]);
    const out = await completeInterview({ callId: "call_1", ...config }, fetchFn);
    assert.ok(!out.ok && out.status === 403);
    assert.equal(calls.length, 1);
  });

  it("refuses a call that did not come from this site", async () => {
    const { fetchFn } = fakeFetch([retellRoute({ ...endedCall, metadata: { candidate_email: "x@y.com" } })]);
    const out = await completeInterview({ callId: "call_1", ...config }, fetchFn);
    assert.ok(!out.ok && out.status === 403);
  });

  it("refuses a call without a candidate email", async () => {
    const { fetchFn } = fakeFetch([retellRoute({ ...endedCall, metadata: { source: "courierboard", job_id: "j1" } })]);
    const out = await completeInterview({ callId: "call_1", ...config }, fetchFn);
    assert.ok(!out.ok && out.status === 403);
  });

  it("asks the caller to retry while the call is still running", async () => {
    const { fetchFn, calls } = fakeFetch([retellRoute({ ...endedCall, call_status: "ongoing" })]);
    const out = await completeInterview({ callId: "call_1", ...config }, fetchFn);
    assert.ok(!out.ok && out.status === 409);
    assert.equal(calls.length, 1);
  });

  it("reports an unknown call as not found", async () => {
    const { fetchFn } = fakeFetch([retellRoute({ error: "nope" }, 404)]);
    const out = await completeInterview({ callId: "call_1", ...config }, fetchFn);
    assert.ok(!out.ok && out.status === 404);
  });

  it("fails with 502 when the platform rejects the invoke, without leaking its body", async () => {
    const { fetchFn } = fakeFetch([retellRoute(endedCall), platformRoute(401, { error: "bad secret agtinv_secret" })]);
    const out = await completeInterview({ callId: "call_1", ...config }, fetchFn);
    assert.ok(!out.ok && out.status === 502 && !out.error.includes("agtinv_secret"));
  });

  it("fails with 502 when the platform is unreachable", async () => {
    const calls: string[] = [];
    const fetchFn = (async (url: string) => {
      calls.push(url);
      if (url.startsWith("https://api.retellai.com")) return new Response(JSON.stringify(endedCall), { status: 200 });
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;
    const out = await completeInterview({ callId: "call_1", ...config }, fetchFn);
    assert.ok(!out.ok && out.status === 502);
  });

  it("encodes the platform agent id into the path", async () => {
    const { fetchFn, calls } = fakeFetch([retellRoute(endedCall), platformRoute()]);
    await completeInterview({ callId: "call_1", ...config, platform: { ...config.platform, agentId: "a/b?c" } }, fetchFn);
    assert.equal(calls[1].url, "https://platform.example.com/api/agents/a%2Fb%3Fc/invoke");
  });
});
