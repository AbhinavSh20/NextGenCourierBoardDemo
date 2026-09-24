const STATUS_STYLES: Record<string, string> = {
  live: "bg-[var(--color-success-bg)] text-[var(--color-success-ink)]",
  closed: "bg-slate-100 text-[var(--color-ink-soft)]",
  new: "bg-violet-50 text-[var(--color-primary-dark)]",
  contacted: "bg-[var(--color-warning-bg)] text-[var(--color-warning-ink)]",
  rejected: "bg-[var(--color-error-bg)] text-[var(--color-error-ink)]",
  hired: "bg-[var(--color-success-bg)] text-[var(--color-success-ink)]",
};

export default function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-[var(--color-ink-soft)]"
      }`}
    >
      {status}
    </span>
  );
}
