import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCallVariables, createWebCall } from "./retellCall.ts";

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
      company: "NextGen Technologies",
      location: "New York, NY",
      pay: "$24/hr",
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
  const input = { apiKey: "key_123", agentId: "agent_abc", variables: buildCallVariables(job, candidate) };

  it("posts to Retell with bearer auth and returns the browser token", async () => {
    const { fetchFn, calls } = fakeFetch(201, { call_id: "call_1", access_token: "tok_1", agent_id: "agent_abc" });
    const out = await createWebCall(input, fetchFn);
    assert.deepEqual(out, { ok: true, callId: "call_1", accessToken: "tok_1" });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.retellai.com/v2/create-web-call");
    const headers = calls[0].init.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer key_123");
    const sent = JSON.parse(String(calls[0].init.body));
    assert.equal(sent.agent_id, "agent_abc");
    assert.equal(sent.retell_llm_dynamic_variables.job_title, "Driver — New York");
    assert.equal(sent.metadata.job_id, "j1");
    assert.equal(sent.metadata.candidate_email, "maria@example.com");
  });

  it("reports an upstream rejection without leaking its body", async () => {
    const { fetchFn } = fakeFetch(401, { error: "secret detail key_123" });
    const out = await createWebCall(input, fetchFn);
    assert.equal(out.ok, false);
    assert.ok(!out.ok && out.status === 401);
    assert.ok(!out.ok && !out.error.includes("key_123"));
  });

  it("fails when Retell answers without a token", async () => {
    const { fetchFn } = fakeFetch(201, { call_id: "call_1" });
    assert.equal((await createWebCall(input, fetchFn)).ok, false);
  });

  it("fails on a non-JSON answer", async () => {
    const { fetchFn } = fakeFetch(502, "Bad Gateway");
    assert.equal((await createWebCall(input, fetchFn)).ok, false);
  });

  it("fails when the network call throws", async () => {
    const fetchFn = (async () => {
      throw new Error("ECONNRESET");
    }) as unknown as typeof fetch;
    const out = await createWebCall(input, fetchFn);
    assert.ok(!out.ok && out.status === 502);
  });
});
