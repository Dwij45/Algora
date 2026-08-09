"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { Badge, DifficultyBadge } from "@/components/ui/Badge";
import { normalizeProblemSlug } from "@/lib/utils/slug";

type SearchItem = {
  frontendId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  acRate: number | null;
  topicTags: { name: string; slug: string }[];
};

export function PracticeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();

  function openSlug(raw: string) {
    const slug = normalizeProblemSlug(raw);
    if (!slug) {
      setError("Enter a valid slug or LeetCode problem URL.");
      return;
    }
    setError(null);
    router.push(`/practice/${slug}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const raw = query.trim();
    if (!raw) return;

    // If it looks like a URL or exact slug, go straight to workspace.
    const asSlug = normalizeProblemSlug(raw);
    if (asSlug && (raw.includes("leetcode.com") || !raw.includes(" "))) {
      openSlug(raw);
      return;
    }

    startTransition(async () => {
      setError(null);
      setSearched(true);
      try {
        const res = await fetch(
          `/api/problems/search?q=${encodeURIComponent(raw)}`,
        );
        const data = (await res.json()) as {
          questions?: SearchItem[];
          error?: string;
        };
        if (!res.ok) {
          setResults([]);
          setError(data.error ?? "Search failed.");
          return;
        }
        setResults(data.questions ?? []);
      } catch {
        setResults([]);
        setError("Network error while searching.");
      }
    });
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
      <p className="mt-2 text-muted">
        Paste a LeetCode URL or slug, or search by keyword.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="two-sum or https://leetcode.com/problems/two-sum/"
          className="h-11 flex-1 rounded-[var(--radius)] border border-border bg-bg2 px-3 text-sm text-text outline-none placeholder:text-muted/70 focus:border-accent/50"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={pending || !query.trim()}
          className="h-11 rounded-[var(--radius)] bg-accent px-5 text-sm font-semibold text-bg0 transition-colors hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Loading…" : "Open / Search"}
        </button>
      </form>

      {error ? (
        <p className="mt-4 rounded-[var(--radius)] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
        <span>Quick:</span>
        {["two-sum", "valid-parentheses", "binary-search"].map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => openSlug(slug)}
            className="rounded-md border border-border bg-bg2/50 px-2 py-1 font-mono text-accent hover:border-accent/40"
          >
            {slug}
          </button>
        ))}
      </div>

      {searched && !pending && !error ? (
        <ul className="mt-8 space-y-2">
          {results.length === 0 ? (
            <li className="rounded-[var(--radius)] border border-border bg-bg2/40 px-4 py-5 text-sm text-muted">
              No problems matched that search.
            </li>
          ) : (
            results.map((item) => (
              <li key={item.titleSlug}>
                <Link
                  href={`/practice/${item.titleSlug}`}
                  className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-bg2/40 px-4 py-3 transition-colors hover:border-accent/35 hover:bg-bg2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-text">
                      <span className="font-mono text-xs text-muted">
                        {item.frontendId ? `#${item.frontendId}` : ""}
                      </span>{" "}
                      {item.title}
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-muted">
                      {item.titleSlug}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <DifficultyBadge difficulty={item.difficulty} />
                    {item.acRate != null ? (
                      <Badge>{item.acRate.toFixed(1)}% AC</Badge>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
