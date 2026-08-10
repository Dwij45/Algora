"use client";

import { useState } from "react";
import {
  COMMON_TOPIC_SEEDS,
  normalizeTopicTag,
  topicLabel,
} from "@/lib/mistakes/categories";

type MistakeFormProps = {
  onCreated?: () => void;
};

/** Manual journal entry — topic string + session id. */
export function MistakeForm({ onCreated }: MistakeFormProps) {
  const [sessionId, setSessionId] = useState("");
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(false);
    const category = normalizeTopicTag(topic);
    if (!category) {
      setError(
        "Enter a topic slug (e.g. tree, two_pointers). Syntax-only tags are rejected.",
      );
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId.trim(),
          category,
          note: note.trim() || null,
          tags: [category],
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to create mistake.");
        return;
      }
      setOk(true);
      setNote("");
      setTopic("");
      onCreated?.();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="space-y-3 rounded-lg border border-border bg-bg2/40 p-4"
    >
      <h2 className="text-sm font-semibold tracking-tight">Log manually</h2>
      <p className="text-xs text-muted">
        Prefer mentor Log buttons. Topic only — not syntax mistakes. Problem
        topics attach automatically from the session.
      </p>
      <label className="block space-y-1">
        <span className="text-xs text-muted">Session id</span>
        <input
          required
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="cuid…"
          className="h-9 w-full rounded-md border border-border bg-bg0 px-2 font-mono text-xs outline-none focus:border-accent/40"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-muted">Topic</span>
        <input
          required
          list="topic-seeds"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. two_pointers or tree"
          className="h-9 w-full rounded-md border border-border bg-bg0 px-2 font-mono text-sm outline-none focus:border-accent/40"
        />
        <datalist id="topic-seeds">
          {COMMON_TOPIC_SEEDS.map((c) => (
            <option key={c} value={c}>
              {topicLabel(c)}
            </option>
          ))}
        </datalist>
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-muted">Note (optional)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full resize-y rounded-md border border-border bg-bg0 px-2 py-1.5 text-sm outline-none focus:border-accent/40"
        />
      </label>
      <button
        type="submit"
        disabled={busy || sessionId.trim().length < 8 || !topic.trim()}
        className="h-9 rounded-md bg-accent px-4 text-xs font-semibold text-bg0 hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save mistake"}
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {ok ? <p className="text-xs text-ok">Saved to journal.</p> : null}
    </form>
  );
}
