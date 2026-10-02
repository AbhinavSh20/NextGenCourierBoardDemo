import { randomUUID } from "node:crypto";
import { pool } from "./db.ts";
import type { JobPatch, NewJob } from "./jobInput.ts";
import type { JobRecord } from "./jobMapping.ts";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS jobs (
  id            text PRIMARY KEY,
  title         text NOT NULL,
  company       text NOT NULL,
  location      text NOT NULL,
  pay           text NOT NULL,
  pay_value     integer NOT NULL DEFAULT 0,
  type          text NOT NULL,
  vehicle       text NOT NULL,
  description   text NOT NULL DEFAULT '',
  requirements  text[] NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'closed', 'expired')),
  openings      integer NOT NULL DEFAULT 1,
  voice_route   text,
  text_route    text,
  external_ref  text UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  renewed_at    timestamptz,
  expires_at    timestamptz
)`;

const COLUMNS = `id, title, company, location, pay, pay_value AS "payValue", type, vehicle, description,
  requirements, status, openings, voice_route AS "voiceRoute", text_route AS "textRoute",
  created_at AS "createdAt", renewed_at AS "renewedAt", expires_at AS "expiresAt"`;

// Created lazily so a fresh Neon database needs no separate migration step.
let ready: Promise<unknown> | undefined;
function ensureSchema() {
  ready ??= pool()
    .query(SCHEMA)
    .catch((err) => {
      ready = undefined;
      throw err;
    });
  return ready;
}

export async function selectJobs(): Promise<JobRecord[]> {
  await ensureSchema();
  const { rows } = await pool().query<JobRecord>(`SELECT ${COLUMNS} FROM jobs ORDER BY created_at DESC`);
  return rows;
}

export async function insertJob(job: NewJob): Promise<{ record: JobRecord; created: boolean }> {
  await ensureSchema();
  const { rows } = await pool().query<JobRecord>(
    `INSERT INTO jobs (id, title, company, location, pay, pay_value, type, vehicle, description,
       requirements, openings, voice_route, text_route, external_ref, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now() + make_interval(days => $15))
     ON CONFLICT (external_ref) DO NOTHING
     RETURNING ${COLUMNS}`,
    [
      randomUUID().slice(0, 8),
      job.title,
      job.company,
      job.location,
      job.pay,
      job.payValue,
      job.type,
      job.vehicle,
      job.description,
      job.requirements,
      job.openings,
      job.voiceRoute,
      job.textRoute,
      job.externalRef,
      job.expiresInDays,
    ],
  );
  if (rows[0]) return { record: rows[0], created: true };

  const existing = await pool().query<JobRecord>(`SELECT ${COLUMNS} FROM jobs WHERE external_ref = $1`, [
    job.externalRef,
  ]);
  return { record: existing.rows[0], created: false };
}

// Patch key to column. Fixed here so request data never reaches the SQL text.
const EDIT_COLUMNS = {
  title: "title",
  company: "company",
  location: "location",
  pay: "pay",
  payValue: "pay_value",
  type: "type",
  vehicle: "vehicle",
  description: "description",
  requirements: "requirements",
  openings: "openings",
  voiceRoute: "voice_route",
  textRoute: "text_route",
} as const;

export async function updateJob(id: string, patch: JobPatch): Promise<JobRecord | null> {
  await ensureSchema();
  const params: unknown[] = [id];
  const sets: string[] = [];

  for (const [key, column] of Object.entries(EDIT_COLUMNS)) {
    const value = patch[key as keyof typeof EDIT_COLUMNS];
    if (value === undefined) continue;
    params.push(value);
    sets.push(`${column} = $${params.length}`);
  }

  if (patch.renew) {
    params.push(patch.expiresInDays ?? 30);
    sets.push("status = 'live'", "renewed_at = now()", `expires_at = now() + make_interval(days => $${params.length})`);
  } else if (patch.status) {
    params.push(patch.status);
    sets.push(`status = $${params.length}`);
    if (patch.status === "expired") sets.push("expires_at = now()");
  }

  const { rows } = await pool().query<JobRecord>(
    `UPDATE jobs SET ${sets.join(", ")} WHERE id = $1 RETURNING ${COLUMNS}`,
    params,
  );
  return rows[0] ?? null;
}

export async function deleteJob(id: string): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await pool().query("DELETE FROM jobs WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
