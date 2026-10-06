import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCallVariables, createRetellWebCall, createWebCall } from "./retellCall.ts";

const job = { id: "j1", title: "Driver — New York", company: "NextGen Technologies", location: "New York, NY", pay: "$24/hr" };
const candidate = { name: "Maria Lopez", email: "maria@example.com" };

function fakeFetch(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchFn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { fetchFn, calls };
}

describe("buildCallVariables", () => {
  it("gives the agent job and candidate context as strings", () => {
    assert.deepEqual(buildCallVariables(job, candidate), {
      job_id: "j1",
      job_title: "Driver — New York",
      job_location: "New York, NY",
      job_pay: "$24/hr",
      job_schedule: "Flexible",
      candidate_name: "Maria Lopez",
      candidate_first_name: "Maria",
      candidate_email: "maria@example.com",
    });
  });

  it("uses the whole name when there is only one word", () => {
    assert.equal(buildCallVariables(job, { ...candidate, name: "Maria" }).candidate_first_name, "Maria");
  });
});

describe("createWebCall", () => {
  const input = {
    baseUrl: "https://backend.example.com",
    agentId: "agent123",
    variables: buildCallVariables(job, candidate),
  };

  it("posts the variables to the platform and returns the browser token", async () => {
    const { fetchFn, calls } = fakeFetch(201, { access_token: "tok_1", call_id: "call_1" });
    const out = await createWebCall(input, fetchFn);
    assert.deepEqual(out, { ok: true, callId: "call_1", accessToken: "tok_1" });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://backend.example.com/api/public/agents/agent123/web-call");
    assert.equal(calls[0].init.method, "POST");
    const headers = calls[0].init.headers as Record<string, string>;
    assert.equal(headers["Content-Type"], "application/json");
    assert.equal(headers["ngrok-skip-browser-warning"], "1");
    assert.equal(headers.Authorization, undefined);
    const sent = JSON.parse(String(calls[0].init.body));
    assert.deepEqual(Object.keys(sent), ["dynamicVariables"]);
    assert.equal(sent.dynamicVariables.job_title, "Driver — New York");
    assert.equal(sent.dynamicVariables.job_schedule, "Flexible");
    assert.equal(sent.dynamicVariables.candidate_email, "maria@example.com");
  });

  it("handles a trailing slash and encodes the agent id", async () => {
    const { fetchFn, calls } = fakeFetch(200, { access_token: "t", call_id: "c" });
    await createWebCall({ ...input, baseUrl: "https://backend.example.com/", agentId: "a/b?c" }, fetchFn);
    assert.equal(calls[0].url, "https://backend.example.com/api/public/agents/a%2Fb%3Fc/web-call");
  });

  it("maps 404 to agent-not-enabled and 429 to rate-limited", async () => {
    const notFound = await createWebCall(input, fakeFetch(404, { message: "nope" }).fetchFn);
    assert.deepEqual(notFound, { ok: false, status: 404, error: "Voice agent is not enabled" });
    const limited = await createWebCall(input, fakeFetch(429, { message: "slow" }).fetchFn);
    assert.deepEqual(limited, { ok: false, status: 429, error: "Rate limited" });
  });

  it("reports other rejections without leaking the platform's answer", async () => {
    const { fetchFn } = fakeFetch(500, { error: "internal db host=10.0.0.5 secret" });
    const out = await createWebCall(input, fetchFn);
    assert.ok(!out.ok && out.status === 502);
    assert.ok(!out.ok && !out.error.includes("10.0.0.5"));
  });

  it("fails when the platform answers without a token or call id", async () => {
    assert.equal((await createWebCall(input, fakeFetch(201, { call_id: "c" }).fetchFn)).ok, false);
    assert.equal((await createWebCall(input, fakeFetch(201, { access_token: "t" }).fetchFn)).ok, false);
  });

  it("fails on a non-JSON answer", async () => {
    const out = await createWebCall(input, fakeFetch(200, "<html>tunnel page</html>").fetchFn);
    assert.ok(!out.ok && out.status === 502);
  });

  it("fails when the network call throws", async () => {
    const fetchFn = (async () => {
      throw new Error("ECONNRESET");
    }) as unknown as typeof fetch;
    const out = await createWebCall(input, fetchFn);
    assert.ok(!out.ok && out.status === 502);
  });
});

describe("createRetellWebCall", () => {
  const input = { apiKey: "key_123", agentId: "agent_abc", variables: buildCallVariables(job, candidate) };

  it("creates the call straight on Retell with bearer auth and returns the browser token", async () => {
    const { fetchFn, calls } = fakeFetch(201, { call_id: "call_1", access_token: "tok_1", agent_id: "agent_abc" });
    const out = await createRetellWebCall(input, fetchFn);
    assert.deepEqual(out, { ok: true, callId: "call_1", accessToken: "tok_1" });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.retellai.com/v2/create-web-call");
    const headers = calls[0].init.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer key_123");
    const sent = JSON.parse(String(calls[0].init.body));
    assert.equal(sent.agent_id, "agent_abc");
    assert.equal(sent.retell_llm_dynamic_variables.job_title, "Driver — New York");
    assert.equal(sent.retell_llm_dynamic_variables.candidate_first_name, "Maria");
    assert.equal(sent.metadata.source, "courierboard");
    assert.equal(sent.metadata.job_id, "j1");
    assert.equal(sent.metadata.candidate_email, "maria@example.com");
  });

  it("reports a rejected key or agent without leaking Retell's answer", async () => {
    const out = await createRetellWebCall(input, fakeFetch(401, { error: "bad key_123" }).fetchFn);
    assert.ok(!out.ok && out.status === 502 && !out.error.includes("key_123"));
  });

  it("maps 429 to rate-limited", async () => {
    const out = await createRetellWebCall(input, fakeFetch(429, {}).fetchFn);
    assert.deepEqual(out, { ok: false, status: 429, error: "Rate limited" });
  });

  it("fails without a token, on non-JSON, and on network errors", async () => {
    assert.equal((await createRetellWebCall(input, fakeFetch(201, { call_id: "c" }).fetchFn)).ok, false);
    assert.equal((await createRetellWebCall(input, fakeFetch(502, "Bad Gateway").fetchFn)).ok, false);
    const boom = (async () => {
      throw new Error("ECONNRESET");
    }) as unknown as typeof fetch;
    const out = await createRetellWebCall(input, boom);
    assert.ok(!out.ok && out.status === 502);
  });
});
