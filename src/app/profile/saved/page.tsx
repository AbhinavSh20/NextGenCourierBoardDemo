"use client";

import JobCard from "@/components/JobCard";
import EmptyState from "@/components/EmptyState";
import { useSavedJobIds } from "@/lib/useSavedJobIds";
import { MOCK_JOBS } from "@/data/jobs";

export default function SavedJobsPage() {
  const savedIds = useSavedJobIds();
  const saved = MOCK_JOBS.filter((job) => savedIds.has(job.id));

  if (saved.length === 0) {
    return (
      <EmptyState
        title="No saved jobs yet"
        message="Tap the heart icon on any job card to save it here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {saved.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
