"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import StatusPill from "@/components/StatusPill";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { MOCK_JOBS } from "@/data/jobs";

type SortKey = "title" | "status" | "applicantCount" | "postedDaysAgo";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
  { key: "applicantCount", label: "Applicants" },
  { key: "postedDaysAgo", label: "Posted" },
];

export default function EmployerDashboardPage() {
  const [postings, setPostings] = useState(MOCK_JOBS);
  const [sortKey, setSortKey] = useState<SortKey>("postedDaysAgo");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const toast = useToast();

  function toggleStatus(id: string, title: string) {
    setPostings((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, status: job.status === "live" ? "closed" : "live" } : job,
      ),
    );
    const closing = postings.find((j) => j.id === id)?.status === "live";
    toast(closing ? `${title} closed` : `${title} reopened`);
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  const sorted = useMemo(() => {
    return [...postings].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return cmp * sortDir;
    });
  }, [postings, sortKey, sortDir]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight text-[var(--color-ink)]">Your postings</h1>
        <Link
          href="/employer/post"
          className="rounded-full bg-[var(--color-primary)] px-3.5 py-1.5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)]"
        >
          Post a job
        </Link>
      </div>

      {postings.length === 0 ? (
        <EmptyState
          title="No postings yet"
          message="Post your first job to start receiving applicants."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-slate-50 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col.key} className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-1 hover:text-[var(--color-ink)]"
                    >
                      {col.label}
                      {sortKey === col.key && <span aria-hidden="true">{sortDir === 1 ? "↑" : "↓"}</span>}
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {sorted.map((job) => (
                <tr key={job.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-medium text-[var(--color-ink)] hover:text-[var(--color-primary)]"
                    >
                      {job.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={job.status} />
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink)]">{job.applicantCount}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-soft)]">{job.postedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <Link
                        href={`/employer/jobs/${job.id}/applicants`}
                        className="font-medium text-[var(--color-primary)] hover:underline"
                      >
                        View applicants
                      </Link>
                      <button
                        type="button"
                        onClick={() => toast("Editing isn't available in this demo yet")}
                        className="font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(job.id, job.title)}
                        className="font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                      >
                        {job.status === "live" ? "Close" : "Reopen"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
