"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, type Role } from "@/components/AuthProvider";

// ponytail: client-side gate over dummy localStorage auth; real protection belongs in middleware/server once auth exists
export default function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = auth.role === role;

  useEffect(() => {
    if (auth.ready && !allowed) {
      router.replace(`/login?role=${role}&next=${encodeURIComponent(pathname)}`);
    }
  }, [auth.ready, allowed, role, pathname, router]);

  if (!auth.ready || !allowed) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
      </div>
    );
  }

  return <>{children}</>;
}
