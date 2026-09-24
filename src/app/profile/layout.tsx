"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import RequireRole from "@/components/RequireRole";

const TABS = [
  { href: "/profile", label: "Overview" },
  { href: "/profile/saved", label: "Saved jobs" },
  { href: "/profile/applications", label: "Applications" },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RequireRole role="seeker">
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
      <h1 className="text-lg font-bold tracking-tight text-[var(--color-ink)]">Your profile</h1>

      <nav className="flex gap-1 border-b border-[var(--color-border)]">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-150 ease-out ${
                active
                  ? "border-[var(--color-primary)] text-[var(--color-primary-dark)]"
                  : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </main>
    </RequireRole>
  );
}
