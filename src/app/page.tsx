import Link from "next/link";
import JobCard from "@/components/JobCard";
import { listJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

const CATEGORIES = ["Same-day", "Contract / 1099", "Full-time", "Owner-operator"];

export default async function Home() {
  const jobs = await listJobs();

  return (
    <main className="flex flex-1 flex-col">
      <section className="bg-[var(--color-chrome)] px-4 py-14">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            Find your next courier job, fast.
          </h1>
          <p className="text-sm text-zinc-400 sm:text-base">
            Same-day delivery, contract, and owner-operator driving jobs near you. No login
            required to apply.
          </p>

          <form
            action="/jobs"
            className="flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-white p-2 sm:flex-row"
          >
            <input
              type="text"
              name="q"
              placeholder="City or zip code"
              className="flex-1 rounded-md px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none"
            />
            <select
              name="type"
              className="rounded-md px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none sm:border-l sm:border-[var(--color-border)]"
              defaultValue=""
            >
              <option value="">Any job type</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)]"
            >
              Search jobs
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href="/jobs"
                className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-zinc-200 transition-colors duration-150 ease-out hover:border-[var(--color-primary)] hover:text-white"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">Recent listings</h2>
          <Link
            href="/jobs"
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            View all jobs →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {jobs.slice(0, 6).map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-primary)] px-4 py-12">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <h2 className="text-lg font-semibold text-white">
            Hiring drivers for your courier business?
          </h2>
          <p className="text-sm text-violet-100">
            Post a job in minutes and reach local drivers and owner-operators today.
          </p>
          <Link
            href="/employer/post"
            className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-zinc-800"
          >
            Post a job
          </Link>
        </div>
      </section>
    </main>
  );
}
