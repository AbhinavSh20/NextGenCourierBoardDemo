"use client";

import { useEffect, useMemo, useState } from "react";
import JobCard from "@/components/JobCard";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/components/Pagination";
import FilterPanel, {
  EMPTY_FILTERS,
  FilterState,
  activeFilterCount,
} from "@/components/FilterPanel";
import type { Job } from "@/data/jobs";

const PAGE_SIZE = 4;
const POLL_INTERVAL_MS = 5000;

export default function JobListingsPage() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<"newest" | "pay">("newest");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    // ND-1540: board must show a new ad without a manual reload.
    async function load() {
      try {
        const res = await fetch("/api/jobs");
        if (!res.ok) throw new Error(String(res.status));
        setJobs(await res.json());
        setLoadFailed(false);
      } catch {
        setLoadFailed(true);
      }
    }
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    const result = (jobs ?? []).filter((job) => {
      if (filters.jobTypes.length && !filters.jobTypes.includes(job.type)) return false;
      if (filters.vehicles.length && !filters.vehicles.includes(job.vehicle)) return false;
      if (filters.maxDaysAgo !== null && job.postedDaysAgo > filters.maxDaysAgo) return false;
      if (filters.payMin !== null && job.payValue < filters.payMin) return false;
      return true;
    });

    return result.sort((a, b) =>
      sort === "newest" ? a.postedDaysAgo - b.postedDaysAgo : b.payValue - a.payValue,
    );
  }, [jobs, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageJobs = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeCount = activeFilterCount(filters);

  function updateFilters(next: FilterState) {
    setFilters(next);
    setPage(1);
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 lg:flex-row lg:gap-8">
      <FilterPanel
        filters={filters}
        onChange={updateFilters}
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      />

      <div className="flex flex-1 flex-col gap-3">
        <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 bg-[var(--color-bg)]/95 px-4 py-3 backdrop-blur-sm">
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">
            {jobs === null ? "Loading jobs…" : `${filtered.length} job${filtered.length === 1 ? "" : "s"} found`}
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="relative rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] lg:hidden"
            >
              Filters
              {activeCount > 0 && (
                <span className="ml-1.5 rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-xs font-semibold text-white">
                  {activeCount}
                </span>
              )}
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "pay")}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            >
              <option value="newest">Newest</option>
              <option value="pay">Pay: high to low</option>
            </select>
          </div>
        </div>

        {jobs === null ? (
          <EmptyState
            title={loadFailed ? "Jobs are unavailable" : "Loading jobs…"}
            message={loadFailed ? "The job feed isn't responding. Retrying every few seconds." : "Fetching the latest listings."}
          />
        ) : pageJobs.length === 0 ? (
          <EmptyState
            title="No jobs match your filters"
            message="Try widening your search — clear a filter or expand your radius."
            actionLabel={activeCount > 0 ? "Clear filters" : undefined}
            onAction={activeCount > 0 ? () => updateFilters(EMPTY_FILTERS) : undefined}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {pageJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
      </div>
    </main>
  );
}
