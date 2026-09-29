import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { pool } from "./db.ts";
import { insertJob, selectJobs, updateJob } from "./jobsStore.ts";
import type { NewJob } from "./jobInput.ts";

const base: NewJob = {
  title: "Store test driver",
  company: "NextGen Technologies",
  location: "New York, NY",
  pay: "$24/hr",
  payValue: 24,
  type: "Contract / 1099",
  vehicle: "Cargo Van",
  description: "Integration test row.",
  requirements: ["License"],
  openings: 2,
  voiceRoute: null,
  textRoute: null,
  externalRef: null,
  expiresInDays: 30,
};

const run = `test-${Date.now()}`;
const created: string[] = [];

describe("jobsStore (needs DATABASE_URL)", { skip: !process.env.DATABASE_URL }, () => {
  after(async () => {
    if (created.length) await pool().query("DELETE FROM jobs WHERE id = ANY($1)", [created]);
    await pool().end();
  });

  it("inserts a live job with an expiry and reads it back", async () => {
    const { record, created: isNew } = await insertJob(base);
    created.push(record.id);
    assert.equal(isNew, true);
    assert.equal(record.status, "live");
    assert.equal(record.openings, 2);
    assert.deepEqual(record.requirements, ["License"]);
    assert.ok(record.expiresAt && record.expiresAt.getTime() > Date.now());

    const all = await selectJobs();
    assert.ok(all.some((j) => j.id === record.id));
  });

  it("returns the existing job for a repeated externalRef", async () => {
    const first = await insertJob({ ...base, externalRef: `${run}-a` });
    created.push(first.record.id);
    const again = await insertJob({ ...base, externalRef: `${run}-a`, title: "Different title" });
    assert.equal(again.created, false);
    assert.equal(again.record.id, first.record.id);
    assert.equal(again.record.title, "Store test driver");
  });

  it("renews an expired job", async () => {
    const { record } = await insertJob(base);
    created.push(record.id);
    const expired = await updateJob(record.id, { status: "expired" });
    assert.equal(expired?.status, "expired");
    assert.ok(expired?.expiresAt && expired.expiresAt.getTime() <= Date.now());

    const renewed = await updateJob(record.id, { renew: true, expiresInDays: 14 });
    assert.equal(renewed?.status, "live");
    assert.ok(renewed?.renewedAt);
    assert.ok(renewed?.expiresAt && renewed.expiresAt.getTime() > Date.now());
  });

  it("closes a job", async () => {
    const { record } = await insertJob(base);
    created.push(record.id);
    assert.equal((await updateJob(record.id, { status: "closed" }))?.status, "closed");
  });

  it("returns null for an unknown id", async () => {
    assert.equal(await updateJob("nope", { status: "closed" }), null);
  });
});
