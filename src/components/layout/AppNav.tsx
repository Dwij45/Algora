"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/practice", label: "Practice" },
  { href: "/journal", label: "Journal" },
  { href: "/insights", label: "Insights" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header
      className={[
        "sticky top-0 z-40 backdrop-blur-md",
        pathname === "/"
          ? "border-b border-transparent bg-bg0/40"
          : "border-b border-border/80 bg-bg0/80",
      ].join(" ")}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2.5">
          <span className="brand-mark brand-mark-nav transition-colors">
            Algora
          </span>
          <span className="hidden text-xs tracking-wide text-muted sm:inline">
            DSA coach
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          {LINKS.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={[
                  "rounded-lg px-2.5 py-1.5 text-sm transition-colors sm:px-3",
                  active
                    ? "bg-bg2 text-text"
                    : "text-muted hover:bg-bg2/70 hover:text-text",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
