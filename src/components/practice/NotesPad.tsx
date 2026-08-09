"use client";

import { PROMPT_LIMITS } from "@/lib/ai/limits";

type NotesPadProps = {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  analyzing: boolean;
  disabled?: boolean;
};

/** Lined notebook pad for natural-language / rough pseudocode. */
export function NotesPad({
  value,
  onChange,
  onAnalyze,
  analyzing,
  disabled,
}: NotesPadProps) {
  const over = value.length > PROMPT_LIMITS.userLogic;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-bg1">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Notes</h2>
          <p className="text-[11px] text-muted">Ruled page for ideas</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={[
              "font-mono text-[11px]",
              over ? "text-danger" : "text-muted",
            ].join(" ")}
          >
            {value.length}/{PROMPT_LIMITS.userLogic}
          </span>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={
              disabled || analyzing || value.trim().length < 20 || over
            }
            className="h-8 rounded-md bg-accent px-3 text-xs font-semibold text-bg0 hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? "Analyzing…" : "Analyze"}
          </button>
        </div>
      </header>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Dictate with Wispr Flow or sketch the approach in words…"
        disabled={disabled || analyzing}
        className="lined-textarea min-h-0 flex-1 resize-none border-0 px-4 py-3 font-mono text-sm text-text outline-none placeholder:text-muted/50"
      />
      {over ? (
        <p className="shrink-0 border-t border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger">
          Too long — trim before analyzing.
        </p>
      ) : null}
    </section>
  );
}
