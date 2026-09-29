import { agentGuard } from "@/lib/agentAuth";
import { parseNewJob } from "@/lib/jobInput";
import { insertJob } from "@/lib/jobsStore";
import { publicOrigin } from "@/lib/publicOrigin";

export async function POST(req: Request) {
  const denied = agentGuard(req);
  if (denied) return denied;

  const parsed = parseNewJob(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  try {
    const { record, created } = await insertJob(parsed.value);
    return Response.json(
      { id: record.id, url: `${publicOrigin(req)}/jobs/${record.id}`, duplicate: !created },
      { status: created ? 201 : 200 },
    );
  } catch (err) {
    console.error("[api/agent/jobs:POST]", err);
    return Response.json({ error: "Failed to create job posting" }, { status: 500 });
  }
}
