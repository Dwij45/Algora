"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { topicLabel } from "@/lib/mistakes/categories";
import type { MistakeDto } from "@/lib/mistakes/serialize";

type Filter = "all" | string;

/** All-time journal list — filter by topic (no week window). */
export function MistakeList() {
  const [filter, setFilter] = useState<Filter>("all");
  const [mistakes, setMistakes] = useState<MistakeDto[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs =
        filter === "all" ? "" : `?category=${encodeURIComponent(filter)}`;
      const res = await fetch(`/api/mistakes${qs}`);
      const data = (await res.json()) as {
        mistakes?: MistakeDto[];
        topics?: string[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Failed to load mistakes.");
        setMistakes([]);
        return;
      }
      setMistakes(data.mistakes ?? []);
      if (data.topics) setTopics(data.topics);
    } catch {
      setError("Network error loading journal.");
      setMistakes([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const chips = useMemo(() => topics, [topics]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Showing all logged topic gaps (not filtered by week). Syntax-only slips
        are not logged as topics.
      </p>
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
        />
        {chips.map((c) => (
          <FilterChip
            key={c}
            active={filter === c}
            onClick={() => setFilter(c)}
            label={topicLabel(c)}
          />
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading journal…</p>
      ) : error ? (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : mistakes.length === 0 ? (
        <p className="text-sm text-muted">No topic logs yet.</p>
      ) : (
        <ul className="space-y-2">
          {mistakes.map((m) => (
            <li
              key={m.id}
              className="rounded-lg border border-border bg-bg2/90 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-warning">
                    {topicLabel(m.category)}
                  </p>
                  {m.tags.length > 0 ? (
                    <p className="mt-1 flex flex-wrap gap-1">
                      {m.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded border border-border/80 px-1.5 py-0.5 font-mono text-[10px] text-muted"
                        >
                          {t}
                        </span>
                      ))}
                    </p>
                  ) : null}
                  <p className="mt-1 truncate text-sm text-text">
                    {m.problemTitle || m.problemSlug || "Unknown problem"}
                  </p>
                  {m.note ? (
                    <p className="mt-1.5 text-sm text-muted">{m.note}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <time className="font-mono text-[11px] text-muted">
                    {new Date(m.createdAt).toLocaleString()}
                  </time>
                  {m.problemSlug ? (
                    <Link
                      href={`/practice/${m.problemSlug}?session=${m.sessionId}`}
                      className="text-xs text-accent hover:text-accent-dim"
                    >
                      Open session →
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-8 rounded-md border px-2.5 text-xs font-medium transition-colors",
        active
          ? "border-accent/50 bg-accent/15 text-accent"
          : "border-border bg-bg2/90 text-muted hover:text-text",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
