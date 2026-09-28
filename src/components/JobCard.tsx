"use client";

import Link from "next/link";
import type { Job } from "@/data/jobs";
import Tag from "@/components/Tag";
import StatusPill from "@/components/StatusPill";
import { LocationPinIcon, ClockIcon, PhoneIcon, MessageIcon, vehicleIcon } from "@/components/icons";
import { useSavedJobIds } from "@/lib/useSavedJobIds";
import { toggleSaved } from "@/lib/savedJobsStore";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 21s-7.5-4.6-10-9.3C.5 8 2 4 6 4c2.2 0 3.7 1.3 6 3.6C14.3 5.3 15.8 4 18 4c4 0 5.5 4 4 7.7C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export default function JobCard({ job }: { job: Job }) {
  const saved = useSavedJobIds().has(job.id);

  return (
    <article className="group relative grid grid-cols-[auto_1fr_auto] gap-x-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-[border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40 hover:shadow-lg sm:p-5">
      <Link
        href={`/jobs/${job.id}`}
        className="absolute inset-0 z-0 rounded-xl"
        aria-label={`View ${job.title} at ${job.company}`}
      />

      <span className="relative row-span-2 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-[var(--color-primary-dark)] transition-transform duration-150 ease-out group-hover:scale-105">
        {vehicleIcon(job.vehicle, "h-5 w-5")}
      </span>

      <div className="relative col-start-2 min-w-0">
        <h3 className="truncate text-sm font-semibold text-[var(--color-ink)] transition-colors duration-150 ease-out group-hover:text-[var(--color-primary-dark)]">
          {job.title}
        </h3>
        <p className="pointer-events-none truncate text-xs text-[var(--color-ink-soft)]">{job.company}</p>
      </div>

      <button
        type="button"
        aria-label="Save job"
        aria-pressed={saved}
        onClick={() => toggleSaved(job.id)}
        className={`relative z-10 col-start-3 row-span-2 -mr-1.5 -mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-full transition-[color,background-color,transform] duration-150 ease-out active:scale-90 ${
          saved
            ? "text-[var(--color-accent)]"
            : "text-[var(--color-muted)] hover:bg-slate-50 hover:text-[var(--color-accent)]"
        }`}
      >
        <HeartIcon filled={saved} />
      </button>

      <div className="pointer-events-none relative col-start-2 mt-2 flex flex-col gap-1">
        <span className="text-base font-bold text-[var(--color-ink)]">{job.pay}</span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-ink-soft)]">
          <span className="inline-flex items-center gap-1">
            <LocationPinIcon />
            {job.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <ClockIcon />
            {job.postedAt}
          </span>
          {job.renewedAt && <span className="text-[var(--color-primary-dark)]">{job.renewedAt}</span>}
          {job.expiresAt && <span>{job.expiresAt}</span>}
        </div>
      </div>

      <div className="pointer-events-none relative col-start-2 col-span-2 mt-2.5 flex flex-wrap items-center gap-1.5">
        <Tag>{job.type}</Tag>
        <Tag variant="neutral">{job.vehicle}</Tag>
        {job.isNew && <Tag variant="success">New</Tag>}
        {job.status !== "live" && <StatusPill status={job.status} />}
      </div>

      {(job.voiceRoute || job.textRoute) && (
        <div className="relative z-10 col-start-2 col-span-2 mt-2.5 flex gap-2">
          {job.voiceRoute && (
            <a
              href={job.voiceRoute}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition-colors duration-150 ease-out hover:border-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
            >
              <PhoneIcon className="h-3.5 w-3.5" />
              Call
            </a>
          )}
          {job.textRoute && (
            <a
              href={job.textRoute}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition-colors duration-150 ease-out hover:border-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
            >
              <MessageIcon className="h-3.5 w-3.5" />
              Text
            </a>
          )}
        </div>
      )}
    </article>
  );
}
