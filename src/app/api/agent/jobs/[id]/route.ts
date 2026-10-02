import { agentGuard } from "@/lib/agentAuth";
import { parseJobPatch } from "@/lib/jobInput";
import { toJob } from "@/lib/jobMapping";
import { deleteJob, updateJob } from "@/lib/jobsStore";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
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

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = agentGuard(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    if (!(await deleteJob(id))) return Response.json({ error: "Job not found" }, { status: 404 });
    return Response.json({ id, deleted: true });
  } catch (err) {
    console.error("[api/agent/jobs/:id:DELETE]", err);
    return Response.json({ error: "Failed to delete job posting" }, { status: 500 });
  }
}
