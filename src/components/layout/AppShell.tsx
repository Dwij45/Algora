"use client";

import { AppNav } from "./AppNav";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullBleedWorkspace = /^\/practice\/[^/]+/.test(pathname);
  const isLanding = pathname === "/";
  const fullBleed = fullBleedWorkspace || isLanding;

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main
        className={
          fullBleed
            ? "flex min-h-0 flex-1 flex-col"
            : "mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
        }
      >
        {children}
      </main>
      {fullBleed ? null : (
        <footer className="border-t border-border/60 py-4 text-center text-xs text-muted">
          Local-first · Algora DSA coach · no account required
        </footer>
      )}
    </div>
  );
}
