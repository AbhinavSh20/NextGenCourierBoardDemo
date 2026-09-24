import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <p className="text-5xl font-extrabold tracking-tight text-[var(--color-primary)]">404</p>
      <h1 className="text-lg font-bold text-[var(--color-ink)]">Page not found</h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/jobs"
        className="mt-2 rounded-md bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)]"
      >
        Browse jobs
      </Link>
    </main>
  );
}
