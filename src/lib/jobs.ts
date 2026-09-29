import { MOCK_JOBS, type Job } from "@/data/jobs";
import { toJob } from "@/lib/jobMapping";
import { selectJobs } from "@/lib/jobsStore";

export async function listJobs(): Promise<Job[]> {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[jobs] DATABASE_URL not set, serving MOCK_JOBS (dev only)");
      return MOCK_JOBS;
    }
    throw new Error("DATABASE_URL is not set");
  }
  return (await selectJobs()).map((record) => toJob(record));
}
