import Link from "next/link";
import StatusPill from "@/components/StatusPill";
import EmptyState from "@/components/EmptyState";
import { MOCK_JOBS } from "@/data/jobs";
import { MY_APPLICATIONS } from "@/data/myApplications";

export default function ApplicationsPage() {
  const rows = MY_APPLICATIONS.map((app) => ({
    ...app,
    job: MOCK_JOBS.find((j) => j.id === app.jobId),
  })).filter((row) => row.job);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No applications yet"
        message="Jobs you apply to will show up here with their status."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div
          key={row.jobId}
          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-4 py-3"
        >
          <div className="min-w-0">
            <Link
              href={`/jobs/${row.job!.id}`}
              className="truncate text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-primary)]"
            >
              {row.job!.title}
            </Link>
            <p className="truncate text-xs text-[var(--color-ink-soft)]">
              {row.job!.company} · Applied {row.appliedAt}
            </p>
          </div>
          <StatusPill status={row.status} />
        </div>
      ))}
    </div>
  );
}
