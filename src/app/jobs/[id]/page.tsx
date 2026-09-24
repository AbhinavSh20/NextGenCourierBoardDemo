import Link from "next/link";
import { notFound } from "next/navigation";
import JobCard from "@/components/JobCard";
import Tag from "@/components/Tag";
import { LocationPinIcon, ClockIcon, vehicleIcon } from "@/components/icons";
import { MOCK_JOBS } from "@/data/jobs";

export default async function JobDetailPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const job = MOCK_JOBS.find((j) => j.id === id);

  if (!job) notFound();

  const related = MOCK_JOBS.filter(
    (j) => j.id !== job.id && (j.vehicle === job.vehicle || j.type === job.type),
  ).slice(0, 3);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 pb-28 lg:pb-8">
      <Link
        href="/jobs"
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-[var(--color-ink-soft)] transition-colors duration-150 ease-out hover:text-[var(--color-primary)]"
      >
        ← Back to listings
      </Link>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="h-1.5 bg-[var(--color-primary)]" />
        <div className="p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-[var(--color-primary-dark)]">
              {vehicleIcon(job.vehicle, "h-6 w-6")}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--color-ink-soft)]">{job.company}</p>
              <h1 className="text-xl font-bold leading-tight tracking-tight text-[var(--color-ink)]">
                {job.title}
              </h1>
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-[var(--color-primary-dark)]">
              {job.pay}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-ink-soft)]">
            <span className="inline-flex items-center gap-1.5">
              <LocationPinIcon className="h-4 w-4" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4" />
              Posted {job.postedAt}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <Tag>{job.type}</Tag>
            <Tag variant="neutral">{job.vehicle}</Tag>
            {job.isNew && <Tag variant="success">New</Tag>}
          </div>

          <Link
            href={`/jobs/${job.id}/apply`}
            className="mt-6 hidden w-full rounded-md bg-[var(--color-primary)] py-2.5 text-center text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)] lg:block"
          >
            Apply now
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Description
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-ink)]">{job.description}</p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Requirements
        </h2>
        <ul className="flex flex-col gap-1.5">
          {job.requirements.map((req) => (
            <li key={req} className="flex gap-2 text-sm text-[var(--color-ink)]">
              <span className="text-[var(--color-primary)]">•</span>
              {req}
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Similar jobs
          </h2>
          <div className="flex flex-col gap-3">
            {related.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/40 bg-[var(--color-surface)]/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden">
        <Link
          href={`/jobs/${job.id}/apply`}
          className="block w-full rounded-md bg-[var(--color-primary)] py-2.5 text-center text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)]"
        >
          Apply now
        </Link>
      </div>
    </main>
  );
}
