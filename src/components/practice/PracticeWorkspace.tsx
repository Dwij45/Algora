"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { LogicInput } from "@/components/practice/LogicInput";
import { NotesPad } from "@/components/practice/NotesPad";
import { MentorPanel } from "@/components/practice/MentorPanel";
import { ProblemPanel } from "@/components/practice/ProblemPanel";
import { SessionContinue } from "@/components/practice/SessionContinue";
import { TopicBadge } from "@/components/ui/Badge";
import { exportBoardPngBase64 } from "@/lib/board/exportBoard";
import type { MentorAnalysis, SessionMessage } from "@/lib/ai/schemas";
import type { ProblemApiDto } from "@/lib/leetcode/normalize";
import type { RunDto } from "@/lib/judge/serialize";
import type { SessionDto } from "@/lib/sessions/serialize";

const BoardCanvas = dynamic(
  () =>
    import("@/components/practice/BoardCanvas").then((m) => m.BoardCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-bg1 text-sm text-muted">
        Loading board…
      </div>
    ),
  },
);

type PracticeWorkspaceProps = {
  problem: ProblemApiDto;
  initialSessionId?: string | null;
};

type SideMode = "notes" | "code" | "board";

const SIDE_TABS: {
  id: SideMode;
  label: string;
  active: string;
}[] = [
  {
    id: "notes",
    label: "Notes",
    active: "bg-warning/20 text-warning ring-1 ring-warning/50",
  },
  {
    id: "code",
    label: "Code",
    active: "bg-accent/20 text-accent ring-1 ring-accent/50",
  },
  {
    id: "board",
    label: "Board",
    active: "bg-sky-400/20 text-sky-300 ring-1 ring-sky-400/50",
  },
];

function isMentorAnalysis(value: unknown): value is MentorAnalysis {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as MentorAnalysis).socraticQuestions)
  );
}

function logicPayload(notes: string, code: string, mode: SideMode): string {
  if (mode === "code") return code.trim() || notes.trim();
  if (mode === "notes") return notes.trim() || code.trim();
  return code.trim() || notes.trim();
}

export function PracticeWorkspace({
  problem,
  initialSessionId,
}: PracticeWorkspaceProps) {
  const [sideMode, setSideMode] = useState<SideMode>("notes");
  const [notes, setNotes] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [codeByLang, setCodeByLang] = useState<Record<string, string>>({});
  const [session, setSession] = useState<SessionDto | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SessionDto[]>([]);
  const [includeBoard, setIncludeBoard] = useState(false);
  const [judgeConfigured, setJudgeConfigured] = useState(false);
  const [judgeCurated, setJudgeCurated] = useState(false);
  const [judgeReachable, setJudgeReachable] = useState(false);
  const [starters, setStarters] = useState<Record<string, string> | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<RunDto | null>(null);

  const analysis =
    session && isMentorAnalysis(session.analysis) ? session.analysis : null;
  const messages: SessionMessage[] = session?.messages ?? [];

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/sessions?problemSlug=${encodeURIComponent(problem.slug)}&limit=8`,
      );
      const data = (await res.json()) as { sessions?: SessionDto[] };
      if (res.ok) setHistory(data.sessions ?? []);
    } catch {
      // non-fatal
    }
  }, [problem.slug]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const loadJudgeMeta = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/problems/${encodeURIComponent(problem.slug)}/tests`,
      );
      const data = (await res.json()) as {
        configured?: boolean;
        reachable?: boolean;
        curated?: boolean;
        starters?: Record<string, string> | null;
      };
      if (!res.ok) return;
      setJudgeConfigured(Boolean(data.configured));
      setJudgeReachable(Boolean(data.reachable));
      setJudgeCurated(Boolean(data.curated));
      setStarters(data.starters ?? null);
    } catch {
      // non-fatal
    }
  }, [problem.slug]);
  
  useEffect(() => {
    void loadJudgeMeta();
  }, [loadJudgeMeta]);
  
  useEffect(() => {
    function onFocus() {
      void loadJudgeMeta();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadJudgeMeta]);

  useEffect(() => {
    let lang = "python";
    let byLang: Record<string, string> = {};
    try {
      const raw = localStorage.getItem(`algora:code:${problem.slug}`);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          language?: string;
          byLang?: Record<string, string>;
        };
        if (parsed.language) lang = parsed.language;
        if (parsed.byLang) byLang = parsed.byLang;
      }
    } catch {
      // ignore
    }
    setLanguage(lang);
    setCodeByLang(byLang);
    setCode(byLang[lang] ?? "");
    setLastRun(null);
    setRunError(null);
  }, [problem.slug]);

  useEffect(() => {
    if (!starters) return;
    setCode((current) => {
      if (current.trim()) return current;
      return starters[language] ?? current;
    });
  }, [starters, language, problem.slug]);

  function persistCode(nextLang: string, nextCode: string, extra?: Record<string, string>) {
    const byLang = { ...codeByLang, ...extra, [nextLang]: nextCode };
    setCodeByLang(byLang);
    try {
      localStorage.setItem(
        `algora:code:${problem.slug}`,
        JSON.stringify({ language: nextLang, byLang }),
      );
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!initialSessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${initialSessionId}`);
        const data = (await res.json()) as {
          session?: SessionDto;
          error?: string;
        };
        if (!res.ok || !data.session || cancelled) return;
        setSession(data.session);
        setNotes(data.session.userLogic);
        if (data.session.userCode) setCode(data.session.userCode);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialSessionId]);

  async function onAnalyze() {
    setAnalyzing(true);
    setError(null);

    let boardImageBase64: string | null = null;
    if (includeBoard) {
      try {
        boardImageBase64 = await exportBoardPngBase64(problem.slug);
      } catch {
        setError("Could not export the board image.");
        setAnalyzing(false);
        return;
      }
      if (!boardImageBase64) {
        setError(
          "Send board is on, but the board is empty — draw something or turn the toggle off.",
        );
        setAnalyzing(false);
        return;
      }
    }

    const userLogic =
      logicPayload(notes, code, sideMode) ||
      (boardImageBase64
        ? "Approach is sketched on the whiteboard."
        : "");

    if (sideMode === "board") setSideMode("notes");
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: problem.slug,
          userLogic,
          userCode: code.trim() || null,
          selfComplexity: null,
          boardImageBase64,
          boardImageMime: boardImageBase64 ? "image/png" : null,
        }),
      });
      const data = (await res.json()) as {
        session?: SessionDto;
        error?: string;
      };
      if (!res.ok || !data.session) {
        setError(data.error ?? "Analyze failed.");
        return;
      }
      setSession(data.session);
      void loadHistory();
    } catch {
      setError("Network error while analyzing.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function onContinue(payload: {
    message?: string;
    revealAlternates?: boolean;
  }) {
    if (!session) return;
    setContinuing(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}/continue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { session?: SessionDto; error?: string };
      if (!res.ok || !data.session) {
        setError(data.error ?? "Continue failed.");
        return;
      }
      setSession(data.session);
    } catch {
      setError("Network error on continue.");
    } finally {
      setContinuing(false);
    }
  }

  function onLanguageChange(next: string) {
    persistCode(next, codeByLang[next] || starters?.[next] || "", { [language]: code });
    setCode(codeByLang[next] || starters?.[next] || "");
    setLanguage(next);
  }

  async function onJudge(mode: "sample" | "submit") {
    setRunning(true);
    setRunError(null);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: problem.slug,
          language,
          sourceCode: code,
          mode,
          sessionId: session?.id ?? null,
        }),
      });
      const data = (await res.json()) as { run?: RunDto; error?: string };
      if (!res.ok || !data.run) {
        setRunError(data.error ?? "Run failed.");
        return;
      }
      setLastRun(data.run);
    } catch {
      setRunError("Network error while talking to the judge.");
    } finally {
      setRunning(false);
    }
  }

  function reopen(s: SessionDto) {
    setSession(s);
    setNotes(s.userLogic);
    if (s.userCode) setCode(s.userCode);
    setError(null);
    setSideMode("notes");
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0 flex-col overflow-hidden bg-bg0">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-bg1 px-3 py-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/practice"
              className="shrink-0 text-xs text-muted hover:text-accent"
            >
              ← Problems
            </Link>
            <span className="truncate text-sm font-medium text-text">
              {problem.title}
            </span>
          </div>
          {problem.tags.length > 0 ? (
            <div className="flex min-w-0 flex-wrap gap-1 pl-[4.5rem]">
              {problem.tags.slice(0, 6).map((tag) => (
                <TopicBadge key={tag.slug} name={tag.name} slug={tag.slug} />
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="flex rounded-lg border border-border bg-bg0 p-1">
              {SIDE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSideMode(tab.id)}
                  className={[
                    "h-9 min-w-[4.5rem] rounded-md px-3 text-sm font-semibold transition-colors",
                    sideMode === tab.id
                      ? tab.active
                      : "text-muted hover:bg-bg-elevated hover:text-text",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <label
              className={[
                "flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-xs font-semibold transition-colors",
                includeBoard
                  ? "border-sky-400/50 bg-sky-400/15 text-sky-300"
                  : "border-border bg-bg0 text-muted hover:text-text",
              ].join(" ")}
              title="When on, Analyze exports the board PNG and sends it to the mentor"
            >
              <input
                type="checkbox"
                className="accent-sky-400"
                checked={includeBoard}
                onChange={(e) => setIncludeBoard(e.target.checked)}
              />
              Send board
            </label>
          </div>
          {history.length > 0 ? (
            <select
              className="h-7 max-w-[10rem] rounded border border-border bg-bg2/90 px-1.5 font-mono text-[11px] text-muted"
              value={session?.id ?? ""}
              onChange={(e) => {
                const found = history.find((h) => h.id === e.target.value);
                if (found) reopen(found);
              }}
            >
              <option value="">sessions…</option>
              {history.map((s) => (
                <option key={s.id} value={s.id}>
                  {new Date(s.createdAt).toLocaleString()}
                </option>
              ))}
            </select>
          ) : null}
          {session ? (
            <span className="font-mono text-[10px] text-muted">
              {session.id.slice(0, 8)}
            </span>
          ) : null}
        </div>
      </div>

      <Group
        orientation="horizontal"
        className="min-h-0 flex-1 overflow-hidden"
        defaultLayout={{ problem: 46, workspace: 54 }}
      >
        <Panel
          id="problem"
          minSize={22}
          className="min-h-0 min-w-0 overflow-hidden"
        >
          <div className="h-full min-h-0 overflow-hidden border-r border-border">
            <ProblemPanel problem={problem} />
          </div>
        </Panel>

        <Separator className="lc-separator-v" />

        <Panel
          id="workspace"
          minSize={30}
          className="min-h-0 min-w-0 overflow-hidden"
        >
          <Group
            orientation="vertical"
            className="h-full min-h-0 overflow-hidden"
            defaultLayout={{ editor: 62, mentor: 38 }}
          >
            <Panel
              id="editor"
              minSize={25}
              className="min-h-0 overflow-hidden"
            >
              <div className="h-full min-h-0 overflow-hidden">
                {sideMode === "notes" ? (
                  <NotesPad
                    value={notes}
                    onChange={setNotes}
                    onAnalyze={onAnalyze}
                    analyzing={analyzing}
                    allowBoardOnly={includeBoard}
                  />
                ) : sideMode === "code" ? (
                  <LogicInput
                    value={code}
                    onChange={(v) => {
                      setCode(v);
                      persistCode(language, v);
                    }}
                    onAnalyze={onAnalyze}
                    analyzing={analyzing}
                    language={language}
                    onLanguageChange={onLanguageChange}
                    allowBoardOnly={includeBoard}
                    judgeConfigured={judgeConfigured}
                    judgeReachable={judgeReachable}
                    judgeCurated={judgeCurated}
                    running={running}
                    runError={runError}
                    lastRun={lastRun}
                    onRun={() => void onJudge("sample")}
                    onSubmit={() => void onJudge("submit")}
                  />
                ) : (
                  <BoardCanvas
                    problemSlug={problem.slug}
                    onAnalyze={onAnalyze}
                    analyzing={analyzing}
                  />
                )}
              </div>
            </Panel>

            <Separator className="lc-separator-h" />

            <Panel
              id="mentor"
              minSize={18}
              className="min-h-0 overflow-hidden"
            >
              <div className="h-full min-h-0 overflow-hidden">
                <MentorPanel
                  analysis={analysis}
                  revealAlternates={Boolean(session?.revealAlternates)}
                  loading={analyzing}
                  error={error}
                  sessionId={session?.id}
                  footer={
                    session ? (
                      <SessionContinue
                        messages={messages}
                        revealAlternates={session.revealAlternates}
                        busy={continuing}
                        onContinue={onContinue}
                      />
                    ) : null
                  }
                />
              </div>
            </Panel>
          </Group>
        </Panel>
      </Group>
    </div>
  );
}
