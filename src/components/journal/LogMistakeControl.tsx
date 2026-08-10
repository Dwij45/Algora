"use client";

import { useState } from "react";
import {
  normalizeTopicTag,
  normalizeTopicTags,
  topicLabel,
} from "@/lib/mistakes/categories";

type LogMistakeControlProps = {
  sessionId: string;
  suggestedTags: string[];
};

/**
 * Confirm-to-log mentor topic tags (concept gaps only).
 * API merges problem LeetCode topics server-side.
 */
export function LogMistakeControl({
  sessionId,
  suggestedTags,
}: LogMistakeControlProps) {
  const [note, setNote] = useState("");
  const [custom, setCustom] = useState("");
  const [logging, setLogging] = useState<string | null>(null);
  const [logged, setLogged] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const tags = normalizeTopicTags(suggestedTags);

  async function logTopic(topic: string) {
    const category = normalizeTopicTag(topic);
    if (!category) {
      setError("Not a valid topic tag (syntax-only tags are ignored).");
      return;
    }
    setLogging(category);
    setError(null);
    try {
      const res = await fetch("/api/mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          category,
          note: note.trim() || null,
          tags: [category],
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to log mistake.");
        return;
      }
      setLogged((prev) => new Set(prev).add(category));
      setCustom("");
    } catch {
      setError("Network error while logging.");
    } finally {
      setLogging(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted">
        Log concept/topic gaps only — not syntax typos. Problem topics are
        attached automatically.
      </p>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note…"
        className="h-8 w-full rounded-md border border-border bg-bg0 px-2 text-xs text-text outline-none placeholder:text-muted/60 focus:border-accent/40"
      />
      {tags.length === 0 ? (
        <p className="text-sm text-muted">
          No topic gaps suggested. Add a topic below if you still want to log
          one.
        </p>
      ) : (
        <ul className="space-y-2">
          {tags.map((tag) => {
            const done = logged.has(tag);
            const busy = logging === tag;
            return (
              <li
                key={tag}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/80 bg-bg0/40 px-2.5 py-2"
              >
                <span className="font-mono text-xs text-warning">
                  {topicLabel(tag)}
                  <span className="ml-1.5 text-muted">({tag})</span>
                </span>
                <button
                  type="button"
                  disabled={done || busy || Boolean(logging)}
                  onClick={() => void logTopic(tag)}
                  className={[
                    "h-7 rounded-md px-2.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed",
                    done
                      ? "bg-ok/20 text-ok"
                      : "bg-warning/20 text-warning hover:bg-warning/30 disabled:opacity-50",
                  ].join(" ")}
                >
                  {done ? "Logged" : busy ? "Logging…" : "Log"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Custom topic e.g. two_pointers"
          className="h-8 min-w-0 flex-1 rounded-md border border-border bg-bg0 px-2 font-mono text-xs outline-none focus:border-accent/40"
        />
        <button
          type="button"
          disabled={Boolean(logging) || !custom.trim()}
          onClick={() => void logTopic(custom)}
          className="h-8 shrink-0 rounded-md bg-warning/20 px-2.5 text-xs font-semibold text-warning hover:bg-warning/30 disabled:opacity-50"
        >
          Log
        </button>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
