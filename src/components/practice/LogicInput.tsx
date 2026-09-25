"use client";

import Editor, { type Monaco } from "@monaco-editor/react";
import { PROMPT_LIMITS } from "@/lib/ai/limits";
import type { RunDto } from "@/lib/judge/serialize";

type LogicInputProps = {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  analyzing: boolean;
  disabled?: boolean;
  language?: string;
  onLanguageChange?: (lang: string) => void;
  allowBoardOnly?: boolean;
  judgeConfigured?: boolean;
  judgeReachable?: boolean;
  judgeCurated?: boolean;
  running?: boolean;
  runError?: string | null;
  lastRun?: RunDto | null;
  onRun?: () => void;
  onSubmit?: () => void;
};

const LANGS = [
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "javascript", label: "JavaScript" },
] as const;

const MONACO_THEME = "algora-dark";

function defineTheme(monaco: Monaco) {
  monaco.editor.defineTheme(MONACO_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#1a1a1a",
      "editor.foreground": "#eff1f6",
      "editorLineNumber.foreground": "#5c5c5c",
      "editorLineNumber.activeForeground": "#8b8b8b",
      "editor.lineHighlightBackground": "#222222",
      "editor.selectionBackground": "#2a3f3c",
      "editorCursor.foreground": "#3dd6c6",
      "editorWidget.background": "#1a1a1a",
      "editorGutter.background": "#1a1a1a",
    },
  });
}

function verdictClass(verdict: string | null): string {
  if (verdict === "AC") return "text-ok";
  if (verdict === "WA") return "text-danger";
  if (verdict === "CE" || verdict === "TLE" || verdict === "RE") return "text-warning";
  return "text-muted";
}

/** Monaco IDE editor — same grey family as the rest of the app. */
export function LogicInput({
  value,
  onChange,
  onAnalyze,
  analyzing,
  disabled,
  language = "python",
  onLanguageChange,
  allowBoardOnly,
  judgeConfigured = false,
  judgeReachable = false,
  judgeCurated = false,
  running = false,
  runError,
  lastRun,
  onRun,
  onSubmit,
}: LogicInputProps) {
  const over = value.length > PROMPT_LIMITS.userCode;
  const tooShort = value.trim().length < 20 && !allowBoardOnly;
  const busy = Boolean(disabled || analyzing || running);
  const canJudge = judgeReachable && judgeConfigured && judgeCurated && !over && value.trim().length >= 4;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-bg1">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Code</h2>
          <select
            value={language}
            onChange={(e) => onLanguageChange?.(e.target.value)}
            disabled={busy}
            className="h-7 rounded border border-border bg-bg0 px-1.5 font-mono text-[11px] text-muted outline-none focus:border-accent/40"
          >
            {LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={[
              "font-mono text-[11px]",
              over ? "text-danger" : "text-muted",
            ].join(" ")}
          >
            {value.length}/{PROMPT_LIMITS.userCode}
          </span>
          <button
            type="button"
            onClick={onRun}
            disabled={busy || !canJudge}
            title={
              !judgeConfigured
                ? "Executor is disabled (EXECUTOR_DISABLED=1)"
                : !judgeReachable
                  ? "Local runner is not running"
                  : !judgeCurated
                    ? "No curated tests for this slug yet"
                    : "Run sample tests"
            }
            className="h-8 rounded-md border border-border bg-bg0 px-3 text-xs font-semibold text-text hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running && lastRun?.mode !== "submit" ? "Running…" : "Run"}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy || !canJudge}
            title={
              !judgeConfigured
                ? "Executor is disabled (EXECUTOR_DISABLED=1)"
                : !judgeReachable
                  ? "Local runner is not running"
                  : !judgeCurated
                    ? "No curated tests for this slug yet"
                    : "Submit sample and hidden tests"
            }
            className="h-8 rounded-md border border-accent/40 bg-accent/15 px-3 text-xs font-semibold text-accent hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running && lastRun?.mode === "submit" ? "Submitting…" : "Submit"}
          </button>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={busy || tooShort || over}
            className="h-8 rounded-md bg-accent px-3 text-xs font-semibold text-bg0 hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analyzing ? "Analyzing…" : "Analyze"}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden bg-bg1">
        <Editor
          height="100%"
          language={language === "cpp" ? "cpp" : language}
          theme={MONACO_THEME}
          value={value}
          onChange={(v) => onChange(v ?? "")}
          beforeMount={defineTheme}
          options={{
            readOnly: busy,
            fontSize: 14,
            fontFamily: "var(--font-ibm-plex-mono), Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            lineNumbers: "on",
            renderLineHighlight: "line",
            padding: { top: 12, bottom: 12 },
            automaticLayout: true,
            tabSize: language === "python" ? 4 : 2,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
          loading={
            <div className="flex h-full items-center justify-center bg-bg1 text-sm text-muted">
              Loading editor…
            </div>
          }
        />
      </div>

      {over ? (
        <p className="shrink-0 border-t border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger">
          Too long for a reliable run — trim before running or analyzing.
        </p>
      ) : null}

      {runError ? (
        <p className="shrink-0 border-t border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger">
          {runError}
        </p>
      ) : null}

      {lastRun ? (
        <div className="max-h-40 shrink-0 overflow-auto border-t border-border bg-bg0 px-3 py-2">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className={`font-mono text-[11px] font-semibold ${verdictClass(lastRun.verdict)}`}>
              {lastRun.mode === "submit" ? "Submit" : "Run"} · {lastRun.verdict ?? lastRun.status} ·{" "}
              {lastRun.passed}/{lastRun.total}
            </span>
            <span className="font-mono text-[10px] text-muted">{lastRun.language}</span>
          </div>
          <ul className="space-y-1">
            {lastRun.cases.map((c, i) => (
              <li key={c.id} className="font-mono text-[11px] text-muted">
                <span className={c.status === "passed" ? "text-ok" : "text-danger"}>
                  {c.status === "passed" ? "PASS" : c.status.toUpperCase()}
                </span>
                {c.visibility === "hidden" ? (
                  <span> hidden #{i + 1}</span>
                ) : (
                  <span>
                    {" "}
                    {c.stdin ? `in ${c.stdin}` : `case ${i + 1}`}
                    {c.expected ? ` → ${c.expected}` : ""}
                    {c.status !== "passed" && c.stdout ? ` got ${c.stdout.trim()}` : ""}
                  </span>
                )}
                {c.status !== "passed" && c.stderr ? (
                  <pre className="mt-1 max-h-16 overflow-auto whitespace-pre-wrap text-[10px] text-danger/90">
                    {c.stderr}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : !judgeCurated ? (
        <p className="shrink-0 border-t border-border px-3 py-1.5 text-[11px] text-muted">
          No sample tests curated for this problem yet. Analyze still works. Tests exist for
          two-sum, valid-parentheses, contains-duplicate, palindrome-number,
          best-time-to-buy-and-sell-stock.
        </p>
      ) : !judgeConfigured ? (
        <p className="shrink-0 border-t border-border px-3 py-1.5 text-[11px] text-muted">
          Run / Submit are off (`EXECUTOR_DISABLED=1`). Analyze still works.
        </p>
      ) : !judgeReachable ? (
        <p className="shrink-0 border-t border-border px-3 py-1.5 text-[11px] text-muted">
          Local runner is not running. Start algora-runner (Docker) for Run / Submit. Analyze
          still works.
        </p>
      ) : (
        <p className="shrink-0 border-t border-border px-3 py-1.5 text-[11px] text-muted">
          Run / Submit execute on the local algora-runner (Docker). Your code is sent from the
          server, not the browser.
        </p>
      )}
    </section>
  );
}
