const VARIANT_CLASSES = {
  default: "bg-violet-50 text-[var(--color-primary-dark)]",
  neutral: "bg-slate-100 text-[var(--color-ink-soft)]",
  success: "bg-[var(--color-success-bg)] text-[var(--color-success-ink)]",
} as const;

export default function Tag({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANT_CLASSES;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}
