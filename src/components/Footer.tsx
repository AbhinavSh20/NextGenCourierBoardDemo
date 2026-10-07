import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[var(--color-chrome)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 CourierBoard. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/jobs" className="hover:text-white">
            Find jobs
          </Link>
        </div>
      </div>
    </footer>
  );
}
