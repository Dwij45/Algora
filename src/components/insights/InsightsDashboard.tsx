"use client";

import { useCallback, useEffect, useState } from "react";
import { TopicBadge } from "@/components/ui/Badge";
import { topicLabel } from "@/lib/mistakes/categories";
import type { InsightCard, InsightsPayload } from "@/lib/insights/types";

export function InsightsDashboard() {
  const [data, setData] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights");
      const json = (await res.json()) as {
        insights?: InsightsPayload;
        error?: string;
      };
      if (!res.ok || !json.insights) {
        setError(json.error ?? "Failed to load insights.");
        setData(null);
        return;
      }
      setData(json.insights);
    } catch {
      setError("Network error loading insights.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-muted">Computing insights…</p>;
  }

  if (error) {
    return (
      <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
        {error}
      </p>
    );
  }

  if (!data) return null;

  const progress = Math.min(
    100,
    Math.round((data.sessionCount / data.unlockAtSessions) * 100),
  );

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border bg-bg2/90 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted">
            {data.sessionCount} session{data.sessionCount === 1 ? "" : "s"} ·{" "}
            {data.mistakeCount} topic log
            {data.mistakeCount === 1 ? "" : "s"}
          </span>
          <span className="font-mono text-xs text-muted">
            unlock {data.sessionCount}/{data.unlockAtSessions}
          </span>
        </div>
        {!data.unlocked ? (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-bg0">
              <div
                className="h-full rounded-full bg-accent/70 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-muted">{data.message}</p>
          </div>
        ) : data.message ? (
          <p className="mt-2 text-sm text-muted">{data.message}</p>
        ) : null}
      </div>

      {data.unlocked ? (
        <>
          {data.focusNext.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold tracking-tight text-accent">
                Focus next
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.focusNext.map((t) => (
                  <TopicBadge key={t} name={topicLabel(t)} slug={t} />
                ))}
              </div>
            </section>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <CardColumn
              title="Weaknesses"
              tone="warning"
              empty="No repeating topic gaps yet (need ≥3 logs per topic)."
              cards={data.weaknesses}
            />
            <CardColumn
              title="Strengths"
              tone="ok"
              empty="No clear strengths yet — keep ranking near/optimal on topics."
              cards={data.strengths}
            />
          </div>
        </>
      ) : null}

      {data.topicCounts.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold tracking-tight">
            Topic log counts
          </h2>
          <p className="mt-1 text-xs text-muted">
            All-time journal frequencies (visible before unlock).
          </p>
          <ul className="mt-3 space-y-1.5">
            {data.topicCounts.map((t) => (
              <li
                key={t.topic}
                className="flex items-center justify-between rounded-md border border-border/80 bg-bg2/90 px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs text-text">
                  {topicLabel(t.topic)}
                  <span className="ml-1.5 text-muted">({t.topic})</span>
                </span>
                <span className="font-mono text-xs text-warning">{t.count}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-muted">No topic counts yet.</p>
      )}
    </div>
  );
}

function CardColumn({
  title,
  tone,
  empty,
  cards,
}: {
  title: string;
  tone: "warning" | "ok";
  empty: string;
  cards: InsightCard[];
}) {
  const border =
    tone === "warning" ? "border-warning/35" : "border-ok/35";
  const heading = tone === "warning" ? "text-warning" : "text-ok";

  return (
    <section>
      <h2 className={`text-sm font-semibold tracking-tight ${heading}`}>
        {title}
      </h2>
      {cards.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {cards.map((c) => (
            <li
              key={c.topic}
              className={`rounded-lg border bg-bg-elevated/50 px-3.5 py-3 ${border}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-text">{c.title}</p>
                <span className="font-mono text-[11px] text-muted">
                  ×{c.count}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{c.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
