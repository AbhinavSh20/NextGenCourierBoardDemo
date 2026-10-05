import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCompleteRequest, parseInterviewRequest } from "./interviewSession.ts";

describe("parseCompleteRequest", () => {
  it("accepts a Retell call id", () => {
    const r = parseCompleteRequest({ callId: "call_a1B2-c3_d4" });
    assert.ok(r.ok);
    assert.equal(r.value.callId, "call_a1B2-c3_d4");
  });

  it("rejects non-objects and missing ids", () => {
    for (const body of [null, undefined, "x", 5, [], {}, { callId: "" }, { callId: 5 }]) {
      assert.equal(parseCompleteRequest(body).ok, false);
    }
  });

  it("rejects ids that could alter the upstream URL", () => {
    for (const callId of ["../x", "a/b", "a?b=1", "a b", "a#b", "x".repeat(101)]) {
      assert.equal(parseCompleteRequest({ callId }).ok, false, callId);
    }
  });
});

const valid = { jobId: "abc123", name: "Maria Lopez", email: "maria@example.com" };

describe("parseInterviewRequest", () => {
  it("accepts a valid body and trims strings", () => {
    const r = parseInterviewRequest({ ...valid, name: "  Maria Lopez " });
    assert.ok(r.ok);
    assert.deepEqual(r.value, valid);
  });

  it("rejects non-objects", () => {
    for (const body of [null, undefined, "x", 5, []]) assert.equal(parseInterviewRequest(body).ok, false);
  });

  it("names the missing field", () => {
    for (const field of ["jobId", "name", "email"] as const) {
      const r = parseInterviewRequest({ ...valid, [field]: "" });
      assert.ok(!r.ok && r.error.includes(field), field);
    }
  });

  it("rejects a malformed email", () => {
    for (const email of ["maria", "maria@", "@example.com", "maria@example", "a b@example.com"]) {
      assert.equal(parseInterviewRequest({ ...valid, email }).ok, false, email);
    }
  });

  it("rejects over-long fields", () => {
    assert.equal(parseInterviewRequest({ ...valid, name: "x".repeat(101) }).ok, false);
    assert.equal(parseInterviewRequest({ ...valid, jobId: "x".repeat(101) }).ok, false);
  });
});
