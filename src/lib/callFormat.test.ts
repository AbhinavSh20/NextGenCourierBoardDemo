import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDuration, normalizeTranscript } from "./callFormat.ts";

describe("normalizeTranscript", () => {
  it("keeps agent and user lines in order", () => {
    const out = normalizeTranscript({
      transcript: [
        { role: "agent", content: "Hi Maria." },
        { role: "user", content: "Hello." },
      ],
    });
    assert.deepEqual(out, [
      { role: "agent", content: "Hi Maria." },
      { role: "user", content: "Hello." },
    ]);
  });

  it("drops empty, malformed and unknown-role lines", () => {
    const out = normalizeTranscript({
      transcript: [
        { role: "agent", content: "   " },
        { role: "system", content: "x" },
        { role: "user" },
        null,
        "str",
        { role: "user", content: " Yes " },
      ],
    });
    assert.deepEqual(out, [{ role: "user", content: "Yes" }]);
  });

  it("returns nothing for payloads without a transcript", () => {
    for (const payload of [null, undefined, {}, { transcript: "no" }, 5]) {
      assert.deepEqual(normalizeTranscript(payload), []);
    }
  });
});

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    assert.equal(formatDuration(0), "0:00");
    assert.equal(formatDuration(9), "0:09");
    assert.equal(formatDuration(65), "1:05");
    assert.equal(formatDuration(600), "10:00");
  });

  it("clamps bad input to zero", () => {
    assert.equal(formatDuration(-5), "0:00");
    assert.equal(formatDuration(Number.NaN), "0:00");
  });
});
