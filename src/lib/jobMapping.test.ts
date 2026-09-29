import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toJob, type JobRecord } from "./jobMapping.ts";

const NOW = Date.parse("2026-09-29T12:00:00Z");
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const record: JobRecord = {
  id: "j1",
  title: "Driver — New York",
  company: "NextGen Technologies",
  location: "New York, NY",
  pay: "$24/hr",
  payValue: 24,
  type: "Contract / 1099",
  vehicle: "Cargo Van",
  description: "Same-day routes.",
  requirements: ["License", "Clean MVR"],
  status: "live",
  openings: 2,
  voiceRoute: null,
  textRoute: null,
  createdAt: new Date(NOW - 2 * HOUR),
  renewedAt: null,
  expiresAt: null,
};

describe("toJob", () => {
  it("passes core fields through and defaults applicantCount", () => {
    const job = toJob(record, NOW);
    assert.equal(job.id, "j1");
    assert.deepEqual(job.requirements, ["License", "Clean MVR"]);
    assert.equal(job.status, "live");
    assert.equal(job.applicantCount, 0);
    assert.equal(job.openings, 2);
  });

  it("computes posted labels from createdAt", () => {
    const job = toJob(record, NOW);
    assert.equal(job.postedAt, "2h ago");
    assert.equal(job.isNew, true);
    assert.equal(job.postedDaysAgo, 2 / 24);
    const old = toJob({ ...record, createdAt: new Date(NOW - 3 * DAY) }, NOW);
    assert.equal(old.postedAt, "3d ago");
    assert.equal(old.isNew, false);
  });

  it("never reports a negative age for clock skew", () => {
    const job = toJob({ ...record, createdAt: new Date(NOW + HOUR) }, NOW);
    assert.equal(job.postedAt, "just now");
    assert.equal(job.postedDaysAgo, 0);
  });

  it("renders expiry and renewal labels only when present", () => {
    assert.equal(toJob(record, NOW).expiresAt, undefined);
    assert.equal(toJob(record, NOW).renewedAt, undefined);
    const job = toJob(
      { ...record, expiresAt: new Date(NOW + 21 * DAY), renewedAt: new Date(NOW - DAY) },
      NOW,
    );
    assert.equal(job.expiresAt, "expires in 21d");
    assert.equal(job.renewedAt, "renewed 1d ago");
  });

  it("labels a past expiry as expired", () => {
    assert.equal(toJob({ ...record, expiresAt: new Date(NOW - HOUR) }, NOW).expiresAt, "expired");
  });

  it("reports a live job past its expiry as expired, but never revives a closed one", () => {
    const past = new Date(NOW - HOUR);
    assert.equal(toJob({ ...record, expiresAt: past }, NOW).status, "expired");
    assert.equal(toJob({ ...record, expiresAt: past, status: "closed" }, NOW).status, "closed");
    assert.equal(toJob({ ...record, expiresAt: new Date(NOW + DAY) }, NOW).status, "live");
  });

  it("includes contact routes only when set", () => {
    const bare = toJob(record, NOW);
    assert.equal("voiceRoute" in bare, false);
    const job = toJob({ ...record, voiceRoute: "tel:+1303", textRoute: "sms:+1303" }, NOW);
    assert.equal(job.voiceRoute, "tel:+1303");
    assert.equal(job.textRoute, "sms:+1303");
  });
});
