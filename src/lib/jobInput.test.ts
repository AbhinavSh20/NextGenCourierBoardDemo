import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { derivePayValue, parseEmployerJob, parseJobPatch, parseNewJob } from "./jobInput.ts";

const valid = {
  title: "Driver — New York",
  company: "NextGen Technologies",
  location: "New York, NY",
  pay: "$24/hr",
};

function ok<T>(r: { ok: true; value: T } | { ok: false; error: string }): T {
  assert.ok(r.ok, r.ok ? "" : r.error);
  return r.value;
}

describe("parseNewJob", () => {
  it("accepts the minimal body and fills defaults", () => {
    const job = ok(parseNewJob(valid));
    assert.equal(job.title, "Driver — New York");
    assert.equal(job.openings, 1);
    assert.equal(job.expiresInDays, 30);
    assert.deepEqual(job.requirements, []);
    assert.equal(job.payValue, 24);
    assert.equal(job.voiceRoute, null);
    assert.equal(job.externalRef, null);
  });

  it("trims strings", () => {
    assert.equal(ok(parseNewJob({ ...valid, title: "  Driver  " })).title, "Driver");
  });

  it("rejects non-objects", () => {
    for (const body of [null, undefined, "x", 5, []]) assert.equal(parseNewJob(body).ok, false);
  });

  it("names the missing required field", () => {
    for (const field of ["title", "company", "location", "pay"] as const) {
      const r = parseNewJob({ ...valid, [field]: "" });
      assert.ok(!r.ok && r.error.includes(field), field);
    }
  });

  it("rejects over-long strings", () => {
    assert.equal(parseNewJob({ ...valid, title: "x".repeat(201) }).ok, false);
    assert.equal(parseNewJob({ ...valid, description: "x".repeat(5001) }).ok, false);
  });

  it("validates requirements", () => {
    assert.deepEqual(ok(parseNewJob({ ...valid, requirements: ["a", "b"] })).requirements, ["a", "b"]);
    assert.equal(parseNewJob({ ...valid, requirements: "a" }).ok, false);
    assert.equal(parseNewJob({ ...valid, requirements: [1] }).ok, false);
    assert.equal(parseNewJob({ ...valid, requirements: Array(21).fill("a") }).ok, false);
  });

  it("bounds openings and expiresInDays to integers in range", () => {
    assert.equal(ok(parseNewJob({ ...valid, openings: 3 })).openings, 3);
    for (const openings of [0, 100, 1.5, "2"]) assert.equal(parseNewJob({ ...valid, openings }).ok, false);
    for (const expiresInDays of [0, 366, 2.5]) assert.equal(parseNewJob({ ...valid, expiresInDays }).ok, false);
  });

  it("only allows tel: and sms: routes", () => {
    const job = ok(parseNewJob({ ...valid, voiceRoute: "tel:+13035550188", textRoute: "sms:+13035550188" }));
    assert.equal(job.voiceRoute, "tel:+13035550188");
    assert.equal(job.textRoute, "sms:+13035550188");
    assert.equal(parseNewJob({ ...valid, voiceRoute: "javascript:alert(1)" }).ok, false);
    assert.equal(parseNewJob({ ...valid, textRoute: "https://evil.example" }).ok, false);
    assert.equal(parseNewJob({ ...valid, voiceRoute: "sms:+13035550188" }).ok, false);
  });

  it("treats empty routes as absent", () => {
    assert.equal(ok(parseNewJob({ ...valid, voiceRoute: "" })).voiceRoute, null);
  });

  it("prefers an explicit payValue over the derived one", () => {
    assert.equal(ok(parseNewJob({ ...valid, payValue: 30 })).payValue, 30);
    assert.equal(parseNewJob({ ...valid, payValue: -1 }).ok, false);
  });
});

describe("parseEmployerJob", () => {
  it("accepts the form fields", () => {
    const job = ok(parseEmployerJob({ ...valid, type: "Full-time", vehicle: "Car", requirements: ["a"] }));
    assert.equal(job.type, "Full-time");
    assert.deepEqual(job.requirements, ["a"]);
  });

  it("drops agent-only fields so anonymous callers cannot set them", () => {
    const job = ok(
      parseEmployerJob({
        ...valid,
        externalRef: "squatted",
        voiceRoute: "tel:+15550100",
        textRoute: "sms:+15550100",
        expiresInDays: 365,
        openings: 50,
        payValue: 9999,
      }),
    );
    assert.equal(job.externalRef, null);
    assert.equal(job.voiceRoute, null);
    assert.equal(job.textRoute, null);
    assert.equal(job.expiresInDays, 30);
    assert.equal(job.openings, 1);
    assert.equal(job.payValue, 24);
  });

  it("still enforces required fields", () => {
    assert.equal(parseEmployerJob({ ...valid, title: "" }).ok, false);
    assert.equal(parseEmployerJob(null).ok, false);
  });
});

describe("derivePayValue", () => {
  it("reads hourly pay", () => assert.equal(derivePayValue("$25/hr"), 25));
  it("averages ranges", () => assert.equal(derivePayValue("$22–26/hr"), 24));
  it("converts weekly pay to an hourly equivalent", () => assert.equal(derivePayValue("$1,800/wk"), 45));
  it("returns 0 when there is no number", () => assert.equal(derivePayValue("DOE"), 0));
});

describe("parseJobPatch", () => {
  it("accepts a status change", () => {
    assert.deepEqual(ok(parseJobPatch({ status: "closed" })), { status: "closed" });
  });

  it("accepts renew with an optional window", () => {
    assert.deepEqual(ok(parseJobPatch({ renew: true, expiresInDays: 14 })), { renew: true, expiresInDays: 14 });
  });

  it("rejects an empty patch", () => {
    assert.equal(parseJobPatch({}).ok, false);
    assert.equal(parseJobPatch(null).ok, false);
  });

  it("rejects unknown statuses", () => {
    assert.equal(parseJobPatch({ status: "deleted" }).ok, false);
  });

  it("rejects renewing into a non-live status", () => {
    assert.equal(parseJobPatch({ renew: true, status: "expired" }).ok, false);
  });
});
