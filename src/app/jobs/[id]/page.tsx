import Link from "next/link";
import { notFound } from "next/navigation";
import JobCard from "@/components/JobCard";
import Tag from "@/components/Tag";
import StatusPill from "@/components/StatusPill";
import { LocationPinIcon, ClockIcon, vehicleIcon } from "@/components/icons";
import ScreeningPanel from "@/components/ScreeningPanel";
import { listJobs } from "@/lib/jobs";

export default async function JobDetailPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const jobs = await listJobs();
  const job = jobs.find((j) => j.id === id);

  if (!job) notFound();

  const related = jobs.filter(
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

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-50 ring-1 ring-inset ring-violet-100 text-[var(--color-primary-dark)]">
            {vehicleIcon(job.vehicle, "h-6 w-6")}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-ink-soft)]">{job.company}</p>
            <h1 className="text-xl font-bold leading-tight tracking-tight text-[var(--color-ink)]">
              {job.title}
            </h1>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight text-[var(--color-primary-dark)]">
            {job.pay.split("/")[0]}
          </span>
          {job.pay.includes("/") && (
            <span className="text-base font-semibold text-[var(--color-ink-soft)]">
              /{job.pay.split("/")[1]}
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-ink-soft)]">
          <span className="inline-flex items-center gap-1.5">
            <LocationPinIcon className="h-4 w-4" />
            {job.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon className="h-4 w-4" />
            Posted {job.postedAt}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <Tag>{job.type}</Tag>
          <Tag variant="neutral">{job.vehicle}</Tag>
          {job.isNew && <Tag variant="success">New</Tag>}
          {job.status !== "live" && <StatusPill status={job.status} />}
        </div>

        {(job.renewedAt || job.expiresAt) && (
          <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
            {[job.renewedAt, job.expiresAt].filter(Boolean).join(" · ")}
          </p>
        )}

        <div className="mt-4 hidden sm:block">
          <ScreeningPanel
            variant="card"
            jobId={job.id}
            jobTitle={job.title}
            jobSubtitle={`${job.location} · ${job.pay}`}
          />
        </div>
      </div>

      <section>
        <SectionHeading>Description</SectionHeading>
        <p className="text-sm leading-relaxed text-[var(--color-ink)]">{job.description}</p>
      </section>

      <section>
        <SectionHeading>Requirements</SectionHeading>
        <ul className="flex flex-col gap-1.5">
          {job.requirements.map((req, i) => (
            <li
              key={req}
              className="fade-in-up flex gap-2 text-sm text-[var(--color-ink)]"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="text-[var(--color-primary)]">•</span>
              {req}
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section className="border-t border-[var(--color-border)] pt-6">
          <SectionHeading>Similar jobs</SectionHeading>
          <div className="flex flex-col gap-3">
            {related.map((j, i) => (
              <div key={j.id} className="fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                <JobCard job={j} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-white/40 bg-[var(--color-surface)]/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:hidden">
        <ScreeningPanel
          variant="bar"
          jobId={job.id}
          jobTitle={job.title}
          jobSubtitle={`${job.location} · ${job.pay}`}
        />
      </div>
    </main>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
      <span className="h-3.5 w-1 rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
      {children}
    </h2>
  );
}
