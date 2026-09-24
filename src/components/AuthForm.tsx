"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, type Role } from "@/components/AuthProvider";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { signIn } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<Role>(params.get("role") === "employer" ? "employer" : "seeker");
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    signIn(role, name || (role === "employer" ? "Employer" : "Driver"));
    const next = params.get("next");
    const home = role === "employer" ? "/employer/dashboard" : "/profile";
    // only follow same-site relative paths, never an absolute/protocol-relative URL
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
    const nextFitsRole = safeNext && (role === "employer" ? safeNext.startsWith("/employer") : !safeNext.startsWith("/employer"));
    router.push(nextFitsRole ? safeNext : home);
  }

  return (
    <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-ink)]">
          {mode === "login" ? "Sign in" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {mode === "login"
            ? "Welcome back to CourierBoard."
            : "Job seekers apply without an account — sign up to save jobs and track status."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-md border border-[var(--color-border)] p-1">
        {(["seeker", "employer"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-sm py-2 text-sm font-semibold transition-colors duration-150 ease-out ${
              role === r
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-ink-soft)] hover:bg-slate-50"
            }`}
          >
            {r === "seeker" ? "Job seeker" : "Employer"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-ink)]">Full name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Rivera"
              className="rounded-md border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-ink)]">Email</span>
          <input
            type="email"
            required
            placeholder="you@example.com"
            className="rounded-md border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-ink)]">Password</span>
          <input
            type="password"
            required
            placeholder="••••••••"
            className="rounded-md border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-md bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)]"
        >
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
        <span className="h-px flex-1 bg-[var(--color-border)]" />
        or
        <span className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="rounded-md border border-[var(--color-border)] py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors duration-150 ease-out hover:border-[var(--color-primary)]"
      >
        Continue with Google
      </button>

      <p className="text-center text-sm text-[var(--color-ink-soft)]">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/signup" className="font-medium text-[var(--color-primary)]">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[var(--color-primary)]">
              Sign in
            </Link>
          </>
        )}
      </p>
    </main>
  );
}
