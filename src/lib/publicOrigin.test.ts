import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { publicOrigin } from "./publicOrigin.ts";

const req = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers });

describe("publicOrigin", () => {
  it("prefers the configured base URL and trims a trailing slash", () => {
    const r = req("http://localhost:3000/x", { "x-forwarded-host": "other.example" });
    assert.equal(publicOrigin(r, "https://board.example.com/"), "https://board.example.com");
  });

  it("uses forwarded host and proto behind a proxy", () => {
    const r = req("http://localhost:3000/x", { "x-forwarded-host": "abc.loca.lt", "x-forwarded-proto": "https" });
    assert.equal(publicOrigin(r), "https://abc.loca.lt");
  });

  it("takes the first value of a comma-separated forwarded list", () => {
    const r = req("http://localhost:3000/x", { "x-forwarded-host": "a.example, b.example", "x-forwarded-proto": "https, http" });
    assert.equal(publicOrigin(r), "https://a.example");
  });

  it("falls back to the request origin", () => {
    assert.equal(publicOrigin(req("http://localhost:3000/x")), "http://localhost:3000");
  });

  it("ignores a forwarded host that is not a plain hostname", () => {
    const r = req("http://localhost:3000/x", { "x-forwarded-host": "evil.example/path?x=1" });
    assert.equal(publicOrigin(r), "http://localhost:3000");
  });
});
