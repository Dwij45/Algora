"use client";

import { PROMPT_LIMITS } from "@/lib/ai/limits";

type LogicInputProps = {
  logic: string;
  code: string;
  selfComplexity: string;
  onLogicChange: (v: string) => void;
  onCodeChange: (v: string) => void;
  onSelfComplexityChange: (v: string) => void;
  onAnalyze: () => void;
  analyzing: boolean;
  disabled?: boolean;
};

/** Right pane — lined notebook for approach / pseudocode (LeetCode editor side). */
export function LogicInput({
  logic,
  code,
  selfComplexity,
  onLogicChange,
  onCodeChange,
  onSelfComplexityChange,
  onAnalyze,
  analyzing,
  disabled,
}: LogicInputProps) {
  const logicOver = logic.length > PROMPT_LIMITS.userLogic;
  const codeOver = code.length > PROMPT_LIMITS.userCode;

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[var(--radius)] border border-border bg-bg2/60">
      <header className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold tracking-tight">
          Approach / pseudocode
        </h2>
        <p className="mt-0.5 text-xs text-muted">
          Dictate with Wispr Flow or type on the ruled page
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-5">
        <label className="flex min-h-0 flex-1 flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-medium text-muted">Logic</span>
            <span
              className={[
                "font-mono text-[11px]",
                logicOver ? "text-danger" : "text-muted",
              ].join(" ")}
            >
              {logic.length}/{PROMPT_LIMITS.userLogic}
            </span>
          </div>
          <textarea
            value={logic}
            onChange={(e) => onLogicChange(e.target.value)}
            placeholder="Write your approach or pseudocode…"
            disabled={disabled || analyzing}
            className="lined-textarea min-h-[18rem] flex-1 resize-none rounded-[var(--radius)] border border-border px-3 py-2 font-mono text-sm text-text outline-none placeholder:text-muted/55 focus:border-accent/50"
          />
          {logicOver ? (
            <p className="text-xs text-danger">
              Too long for a reliable mentor call — trim before analyzing.
            </p>
          ) : null}
        </label>

        <details className="shrink-0 rounded-[var(--radius)] border border-border/80 bg-bg1/30">
          <summary className="cursor-pointer px-3 py-2 text-sm text-muted hover:text-text">
            Optional: code paste + self complexity
          </summary>
          <div className="space-y-3 border-t border-border px-3 py-3">
            <label className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-medium text-muted">
                  Code (not executed)
                </span>
                <span
                  className={[
                    "font-mono text-[11px]",
                    codeOver ? "text-danger" : "text-muted",
                  ].join(" ")}
                >
                  {code.length}/{PROMPT_LIMITS.userCode}
                </span>
              </div>
              <textarea
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                placeholder="Paste draft code if you have it…"
                disabled={disabled || analyzing}
                spellCheck={false}
                className="min-h-[7rem] resize-y rounded-[var(--radius)] border border-border bg-bg1 px-3 py-2 font-mono text-xs leading-relaxed text-text outline-none placeholder:text-muted/60 focus:border-accent/50"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">
                Self complexity
              </span>
              <input
                value={selfComplexity}
                onChange={(e) => onSelfComplexityChange(e.target.value)}
                placeholder="e.g. O(n²) time, O(1) space"
                disabled={disabled || analyzing}
                className="h-10 rounded-[var(--radius)] border border-border bg-bg1 px-3 text-sm text-text outline-none placeholder:text-muted/60 focus:border-accent/50"
              />
            </label>
          </div>
        </details>
      </div>

      <div className="shrink-0 border-t border-border p-4">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={
            disabled ||
            analyzing ||
            logic.trim().length < 20 ||
            logicOver ||
            codeOver
          }
          className="h-11 w-full rounded-[var(--radius)] bg-accent text-sm font-semibold text-bg0 transition-colors hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
        >
          {analyzing ? "Analyzing…" : "Analyze approach"}
        </button>
      </div>
    </section>
  );
}
