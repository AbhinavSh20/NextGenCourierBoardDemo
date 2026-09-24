"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const { role, name, signOut } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const links: { href: string; label: string }[] = [{ href: "/jobs", label: "Find jobs" }];
  if (role === "seeker") {
    links.push({ href: "/profile/saved", label: "Saved" });
    links.push({ href: "/profile/applications", label: "Applications" });
  }
  if (role === "employer") {
    links.push({ href: "/employer/dashboard", label: "Dashboard" });
  }

  const showPostJob = role !== "seeker";
  const initial = (name || (role === "employer" ? "E" : "D")).charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--color-chrome)]/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="CourierBoard home">
          <img src="/nextgen-logo.svg" alt="NextGen AI" className="h-5 w-auto brightness-0 invert" />
          <span className="h-4 w-px bg-white/20" aria-hidden="true" />
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Courier<span className="text-violet-300">Board</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Main">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out ${
                  active ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {role === "guest" && (
            <Link
              href="/login"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors duration-150 ease-out hover:text-white"
            >
              Sign in
            </Link>
          )}
          {showPostJob && (
            <Link
              href="/employer/post"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-[var(--color-ink)] transition-colors duration-150 ease-out hover:bg-zinc-200"
            >
              Post a job
            </Link>
          )}
          {role !== "guest" && (
            <div className="flex items-center gap-2 pl-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-white"
                title={name}
                aria-hidden="true"
              >
                {initial}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="rounded-full px-2 py-1.5 text-sm font-medium text-zinc-400 transition-colors duration-150 ease-out hover:text-white"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors duration-150 ease-out hover:bg-white/10 md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
          </svg>
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out md:hidden ${
          menuOpen ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="overflow-hidden">
          <nav className="flex flex-col gap-1 border-t border-white/10 px-4 pb-4 pt-3" aria-label="Mobile">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  tabIndex={menuOpen ? 0 : -1}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-11 items-center rounded-xl px-3 text-[15px] font-medium ${
                    active ? "bg-white/10 text-white" : "text-zinc-300"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
              {showPostJob && (
                <Link
                  href="/employer/post"
                  tabIndex={menuOpen ? 0 : -1}
                  className="flex h-11 items-center justify-center rounded-full bg-white text-[15px] font-semibold text-[var(--color-ink)]"
                >
                  Post a job
                </Link>
              )}
              {role === "guest" ? (
                <Link
                  href="/login"
                  tabIndex={menuOpen ? 0 : -1}
                  className="flex h-11 items-center justify-center rounded-full border border-white/15 text-[15px] font-medium text-white"
                >
                  Sign in
                </Link>
              ) : (
                <button
                  type="button"
                  tabIndex={menuOpen ? 0 : -1}
                  onClick={signOut}
                  className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 text-[15px] font-medium text-white"
                >
                  Sign out{name && <span className="text-zinc-400">· {name}</span>}
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
