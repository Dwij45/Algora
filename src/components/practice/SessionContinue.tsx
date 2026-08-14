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
    <div className="space-y-2">
      {messages.length > 2 ? (
        <ul className="max-h-24 space-y-1.5 overflow-y-auto">
          {messages.slice(2).map((m, i) => (
            <li
              key={`${m.at}-${i}`}
              className="text-xs leading-relaxed text-muted"
            >
              <span className="font-mono text-[10px] text-accent uppercase">
                {m.role === "user" ? "you" : "mentor"}
              </span>{" "}
              <span className="whitespace-pre-wrap text-text/85">{m.content}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Reply to mentor…"
          disabled={disabled || busy}
          className="h-8 flex-1 rounded-md border border-border bg-bg1 px-2 text-xs outline-none focus:border-accent/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || busy || !draft.trim()}
          className="h-8 rounded-md border border-border px-3 text-xs font-medium text-text hover:border-accent/40 disabled:opacity-50"
        >
          {busy ? "…" : "Send"}
        </button>
        {!revealAlternates ? (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => onContinue({ revealAlternates: true })}
            className="h-8 rounded-md px-2 text-xs text-accent hover:text-accent-dim disabled:opacity-50"
          >
            Reveal
          </button>
        ) : null}
      </form>
    </div>
  );
}
