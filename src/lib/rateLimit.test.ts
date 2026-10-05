import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientKey, createRateLimiter } from "./rateLimit.ts";

describe("createRateLimiter", () => {
  it("allows up to the limit then blocks", () => {
    const limit = createRateLimiter({ max: 2, windowMs: 1000 }, () => 0);
    assert.equal(limit("a"), true);
    assert.equal(limit("a"), true);
    assert.equal(limit("a"), false);
  });

  it("tracks keys independently", () => {
    const limit = createRateLimiter({ max: 1, windowMs: 1000 }, () => 0);
    assert.equal(limit("a"), true);
    assert.equal(limit("b"), true);
    assert.equal(limit("a"), false);
  });

  it("frees a slot once the window passes", () => {
    let now = 0;
    const limit = createRateLimiter({ max: 1, windowMs: 1000 }, () => now);
    assert.equal(limit("a"), true);
    now = 999;
    assert.equal(limit("a"), false);
    now = 1000;
    assert.equal(limit("a"), true);
  });

  it("does not count blocked attempts against the window", () => {
    let now = 0;
    const limit = createRateLimiter({ max: 1, windowMs: 1000 }, () => now);
    limit("a");
    now = 500;
    limit("a");
    now = 1000;
    assert.equal(limit("a"), true);
  });
});

describe("clientKey", () => {
  const req = (h: Record<string, string>) => new Request("http://x/", { headers: h });

  it("uses the first forwarded address", () => {
    assert.equal(clientKey(req({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })), "1.2.3.4");
  });

  it("falls back to a shared key when no address is known", () => {
    assert.equal(clientKey(req({})), "unknown");
  });
});
