import { agentGuard } from "@/lib/agentAuth";
import { parseJobPatch } from "@/lib/jobInput";
import { toJob } from "@/lib/jobMapping";
import { updateJob } from "@/lib/jobsStore";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = agentGuard(req);
  if (denied) return denied;

  const parsed = parseJobPatch(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  try {
    const { id } = await params;
    const record = await updateJob(id, parsed.value);
    if (!record) return Response.json({ error: "Job not found" }, { status: 404 });
    return Response.json({ job: toJob(record) });
  } catch (err) {
    console.error("[api/agent/jobs/:id:PATCH]", err);
    return Response.json({ error: "Failed to update job posting" }, { status: 500 });
  }
}
