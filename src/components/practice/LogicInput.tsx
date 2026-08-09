"use client";

import Editor, { type Monaco } from "@monaco-editor/react";
import { PROMPT_LIMITS } from "@/lib/ai/limits";

type LogicInputProps = {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  analyzing: boolean;
  disabled?: boolean;
  language?: string;
  onLanguageChange?: (lang: string) => void;
};

const LANGS = [
  { id: "javascript", label: "JS / Pseudocode" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "plaintext", label: "Plain" },
] as const;

const MONACO_THEME = "problem-solver-dark";

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

/** Monaco IDE editor — same grey family as the rest of the app. */
export function LogicInput({
  value,
  onChange,
  onAnalyze,
  analyzing,
  disabled,
  language = "javascript",
  onLanguageChange,
}: LogicInputProps) {
  const over = value.length > PROMPT_LIMITS.userLogic;

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-bg1">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Code</h2>
          <select
            value={language}
            onChange={(e) => onLanguageChange?.(e.target.value)}
            disabled={disabled || analyzing}
            className="h-7 rounded border border-border bg-bg0 px-1.5 font-mono text-[11px] text-muted outline-none focus:border-accent/40"
          >
            {LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex shrink-0 items-center gap-3">
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

      <div className="min-h-0 flex-1 overflow-hidden bg-bg1">
        <Editor
          height="100%"
          language={language}
          theme={MONACO_THEME}
          value={value}
          onChange={(v) => onChange(v ?? "")}
          beforeMount={defineTheme}
          options={{
            readOnly: Boolean(disabled || analyzing),
            fontSize: 14,
            fontFamily: "var(--font-ibm-plex-mono), Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            lineNumbers: "on",
            renderLineHighlight: "line",
            padding: { top: 12, bottom: 12 },
            automaticLayout: true,
            tabSize: 2,
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
          Too long for a reliable mentor call — trim before analyzing.
        </p>
      ) : null}
    </section>
  );
}
