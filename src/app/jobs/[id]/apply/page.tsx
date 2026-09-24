"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_JOBS } from "@/data/jobs";
import { useToast } from "@/components/Toast";

export default function ApplyPage({ params }: PageProps<"/jobs/[id]/apply">) {
  const { id } = use(params);
  const job = MOCK_JOBS.find((j) => j.id === id);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const toast = useToast();

  if (!job) notFound();

  if (submitted) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-ink)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-ink)]">Application sent</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {job.company} will reach out directly if they'd like to move forward on the{" "}
          {job.title} role.
        </p>
        <Link
          href="/jobs"
          className="mt-2 rounded-md bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)]"
        >
          Browse more jobs
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-6">
      <div>
        <Link
          href={`/jobs/${job.id}`}
          className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]"
        >
          ← Back to job
        </Link>
        <h1 className="mt-2 text-lg font-bold text-[var(--color-ink)]">Apply to {job.title}</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">{job.company} · {job.location}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          // ponytail: no real backend — simulate network latency so the loading state is honest
          setTimeout(() => {
            setSubmitting(false);
            setSubmitted(true);
            toast("Application submitted");
          }, 600);
        }}
        className="flex flex-col gap-4"
      >
        <Field label="Full name" name="name" type="text" required placeholder="Jane Rivera" />
        <Field label="Phone" name="phone" type="tel" required placeholder="(720) 555-0100" />
        <Field label="Email" name="email" type="email" required placeholder="jane@example.com" />
        <Field
          label="Vehicle info"
          name="vehicle"
          type="text"
          required
          placeholder="e.g. 2019 Ford Transit, cargo van"
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-ink)]">Resume (optional)</span>
          <span className="flex items-center justify-between rounded-md border border-dashed border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink-soft)]">
            {fileName ?? "PDF, DOC up to 5MB"}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="max-w-[110px] text-xs"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-ink)]">Short message</span>
          <textarea
            name="message"
            rows={4}
            placeholder="Tell them why you're a good fit"
            className="rounded-md border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
        >
          {submitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-md border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
      />
    </label>
  );
}
