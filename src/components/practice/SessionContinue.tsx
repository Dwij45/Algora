"use client";

import { FormEvent, useState } from "react";
import type { SessionMessage } from "@/lib/ai/schemas";

type SessionContinueProps = {
  messages: SessionMessage[];
  revealAlternates: boolean;
  disabled?: boolean;
  busy?: boolean;
  onContinue: (payload: {
    message?: string;
    revealAlternates?: boolean;
  }) => Promise<void>;
};

export function SessionContinue({
  messages,
  revealAlternates,
  disabled,
  busy,
  onContinue,
}: SessionContinueProps) {
  const [draft, setDraft] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || busy || disabled) return;
    const text = draft.trim();
    setDraft("");
    await onContinue({ message: text });
  }

  return (
    <div className="rounded-[var(--radius)] border border-border bg-bg2/40 p-4">
      <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
        Continue conversation
      </h3>

      {messages.length > 2 ? (
        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
          {messages.slice(2).map((m, i) => (
            <li
              key={`${m.at}-${i}`}
              className={[
                "rounded-md px-3 py-2 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-bg1 text-text"
                  : "border border-border/70 bg-bg1/40 text-muted",
              ].join(" ")}
            >
              <span className="mb-1 block font-mono text-[10px] tracking-wide uppercase opacity-70">
                {m.role === "user" ? "You" : "Mentor"}
              </span>
              <span className="whitespace-pre-wrap">{m.content}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Answer a question or ask for a nudge…"
          disabled={disabled || busy}
          className="h-10 flex-1 rounded-[var(--radius)] border border-border bg-bg1 px-3 text-sm outline-none focus:border-accent/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || busy || !draft.trim()}
          className="h-10 rounded-[var(--radius)] border border-border bg-bg2 px-4 text-sm font-medium text-text transition-colors hover:border-accent/40 disabled:opacity-50"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>

      {!revealAlternates ? (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => onContinue({ revealAlternates: true })}
          className="mt-3 text-sm text-accent hover:text-accent-dim disabled:opacity-50"
        >
          Reveal alternates / compare
        </button>
      ) : (
        <p className="mt-3 text-xs text-muted">Alternates layer is unlocked.</p>
      )}
    </div>
  );
}
