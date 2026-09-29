import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkAgentToken } from "./agentAuth.ts";

describe("checkAgentToken", () => {
  it("accepts the matching bearer token", () => {
    assert.equal(checkAgentToken("Bearer s3cret", "s3cret"), "ok");
  });

  it("rejects a wrong token", () => {
    assert.equal(checkAgentToken("Bearer nope", "s3cret"), "unauthorized");
  });

  it("rejects a missing or malformed header", () => {
    assert.equal(checkAgentToken(null, "s3cret"), "unauthorized");
    assert.equal(checkAgentToken("s3cret", "s3cret"), "unauthorized");
    assert.equal(checkAgentToken("Basic s3cret", "s3cret"), "unauthorized");
  });

  it("fails closed when no token is configured", () => {
    assert.equal(checkAgentToken("Bearer ", undefined), "unconfigured");
    assert.equal(checkAgentToken("Bearer anything", ""), "unconfigured");
  });
});
