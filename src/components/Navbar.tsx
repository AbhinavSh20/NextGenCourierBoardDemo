import Link from "next/link";

export default function Navbar() {
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

        <nav className="ml-auto flex items-center gap-1" aria-label="Main">
          <Link
            href="/jobs"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors duration-150 ease-out hover:bg-white/10 hover:text-white"
          >
            Find jobs
          </Link>
        </nav>
      </div>
    </header>
  );
}
