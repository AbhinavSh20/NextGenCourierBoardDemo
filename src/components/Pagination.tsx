export default function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-center gap-1 pt-2"
      aria-label="Pagination"
    >
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-ink-soft)] transition-colors duration-150 ease-out enabled:hover:border-[var(--color-primary)] disabled:opacity-40"
      >
        Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={n === page ? "page" : undefined}
          className={`h-8 w-8 rounded-md text-sm transition-colors duration-150 ease-out ${
            n === page
              ? "bg-[var(--color-primary)] text-white"
              : "text-[var(--color-ink-soft)] hover:bg-slate-100"
          }`}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-ink-soft)] transition-colors duration-150 ease-out enabled:hover:border-[var(--color-primary)] disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
