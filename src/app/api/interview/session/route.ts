import { buildInterviewUrl, parseInterviewRequest } from "@/lib/interviewSession";
import { listJobs } from "@/lib/jobs";

// Voice interview entry point. Returns { url } and the browser redirects to it.
// Real call setup (platform or Retell) is not built yet: without VOICE_INTERVIEW_URL this answers 501.
export async function POST(req: Request) {
  const parsed = parseInterviewRequest(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const base = process.env.VOICE_INTERVIEW_URL;
  if (!base) return Response.json({ error: "Voice interview is not configured" }, { status: 501 });

  try {
    const job = (await listJobs()).find((j) => j.id === parsed.value.jobId);
    if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

    const url = buildInterviewUrl(base, { job: job.id, title: job.title });
    if (!url) return Response.json({ error: "Voice interview is not configured" }, { status: 501 });
    return Response.json({ url });
  } catch (err) {
    console.error("[api/interview/session]", err);
    return Response.json({ error: "Failed to start voice interview" }, { status: 500 });
  }
}
