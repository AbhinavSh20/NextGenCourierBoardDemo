"use client";

import { Fragment, use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatusPill from "@/components/StatusPill";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { MOCK_JOBS } from "@/data/jobs";
import { MOCK_APPLICANTS, type ApplicantStatus } from "@/data/applicants";

const STATUSES: ApplicantStatus[] = ["new", "contacted", "rejected", "hired"];

export default function ApplicantListPage({ params }: PageProps<"/employer/jobs/[id]/applicants">) {
  const { id } = use(params);
  const job = MOCK_JOBS.find((j) => j.id === id);
  const [applicants, setApplicants] = useState(() => MOCK_APPLICANTS.filter((a) => a.jobId === id));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toast = useToast();

  if (!job) notFound();

  function setStatus(applicantId: string, name: string, status: ApplicantStatus) {
    setApplicants((prev) => prev.map((a) => (a.id === applicantId ? { ...a, status } : a)));
    toast(`${name} marked ${status}`);
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
      <div>
        <Link
          href="/employer/dashboard"
          className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-lg font-bold tracking-tight text-[var(--color-ink)]">
          Applicants — {job.title}
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {applicants.length} applicant{applicants.length === 1 ? "" : "s"}
        </p>
      </div>

      {applicants.length === 0 ? (
        <EmptyState title="No applicants yet" message="Applications will show up here as drivers apply." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-slate-50 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {applicants.map((a) => (
                <Fragment key={a.id}>
                  <tr>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                        className="font-medium text-[var(--color-ink)] hover:text-[var(--color-primary)]"
                      >
                        {a.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-soft)]">
                      <div>{a.phone}</div>
                      <div className="text-xs">{a.email}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-soft)]">{a.vehicle}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-soft)]">{a.appliedAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusPill status={a.status} />
                        <select
                          value={a.status}
                          onChange={(e) => setStatus(a.id, a.name, e.target.value as ApplicantStatus)}
                          className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                  {expandedId === a.id && (
                    <tr>
                      <td colSpan={5} className="bg-slate-50 px-4 py-3 text-sm text-[var(--color-ink)]">
                        {a.message}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
