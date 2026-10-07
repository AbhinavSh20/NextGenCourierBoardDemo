import { listJobs } from "@/lib/jobs";

export async function GET() {
  try {
    return Response.json(await listJobs());
  } catch (err) {
    console.error("[api/jobs]", err);
    return Response.json({ error: "Jobs unavailable" }, { status: 502 });
  }
}
