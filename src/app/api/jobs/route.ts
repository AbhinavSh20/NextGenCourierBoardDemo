import { parseEmployerJob } from "@/lib/jobInput";
import { listJobs } from "@/lib/jobs";
import { toJob } from "@/lib/jobMapping";
import { insertJob } from "@/lib/jobsStore";

export async function GET() {
  try {
    return Response.json(await listJobs());
  } catch (err) {
    console.error("[api/jobs]", err);
    return Response.json({ error: "Jobs unavailable" }, { status: 502 });
  }
}

// Employer "Post a job" form. Unauthenticated: the site has no real employer login yet.
export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const parsed = parseEmployerJob(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  try {
    const { record } = await insertJob(parsed.value);
    return Response.json({ job: toJob(record) }, { status: 201 });
  } catch (err) {
    console.error("[api/jobs:POST]", err);
    return Response.json({ error: "Failed to create job posting" }, { status: 500 });
  }
}
