import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseInterviewRequest } from "./interviewSession.ts";

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
