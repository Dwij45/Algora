"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LogicInput } from "@/components/practice/LogicInput";
import { MentorPanel } from "@/components/practice/MentorPanel";
import { ProblemPanel } from "@/components/practice/ProblemPanel";
import { SessionContinue } from "@/components/practice/SessionContinue";
import type { MentorAnalysis, SessionMessage } from "@/lib/ai/schemas";
import type { ProblemApiDto } from "@/lib/leetcode/normalize";
import type { SessionDto } from "@/lib/sessions/serialize";

type PracticeWorkspaceProps = {
  problem: ProblemApiDto;
  initialSessionId?: string | null;
};

function isMentorAnalysis(value: unknown): value is MentorAnalysis {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as MentorAnalysis).socraticQuestions)
  );
}

export function PracticeWorkspace({
  problem,
  initialSessionId,
}: PracticeWorkspaceProps) {
  const [logic, setLogic] = useState("");
  const [code, setCode] = useState("");
  const [selfComplexity, setSelfComplexity] = useState("");
  const [session, setSession] = useState<SessionDto | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SessionDto[]>([]);

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
        setLogic(data.session.userLogic);
        setCode(data.session.userCode ?? "");
        setSelfComplexity(data.session.selfComplexity ?? "");
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
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: problem.slug,
          userLogic: logic,
          userCode: code || null,
          selfComplexity: selfComplexity || null,
        }),
      });
      const data = (await res.json()) as {
        session?: SessionDto;
        error?: string;
        reused?: boolean;
      };
      if (!res.ok || !data.session) {
        setError(data.error ?? "Analyze failed.");
        return;
      }
      setSession(data.session);
      void loadHistory();
      // Scroll mentor into view after analyze.
      queueMicrotask(() => {
        document.getElementById("mentor-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
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

  function reopen(s: SessionDto) {
    setSession(s);
    setLogic(s.userLogic);
    setCode(s.userCode ?? "");
    setSelfComplexity(s.selfComplexity ?? "");
    setError(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/practice"
          className="text-sm text-muted transition-colors hover:text-accent"
        >
          ← Back to search
        </Link>
        {session ? (
          <p className="font-mono text-xs text-muted">
            session {session.id.slice(0, 8)}…
          </p>
        ) : null}
      </div>

      {/* LeetCode-style split: bigger problem left, lined editor right */}
      <div className="grid min-h-[72vh] gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="min-h-[22rem] lg:min-h-0">
          <ProblemPanel problem={problem} />
        </div>
        <div className="min-h-[24rem] lg:min-h-0">
          <LogicInput
            logic={logic}
            code={code}
            selfComplexity={selfComplexity}
            onLogicChange={setLogic}
            onCodeChange={setCode}
            onSelfComplexityChange={setSelfComplexity}
            onAnalyze={onAnalyze}
            analyzing={analyzing}
          />
        </div>
      </div>

      <div id="mentor-section" className="scroll-mt-20">
        <MentorPanel
          analysis={analysis}
          revealAlternates={Boolean(session?.revealAlternates)}
          loading={analyzing}
          error={error}
        />
      </div>

      {session ? (
        <SessionContinue
          messages={messages}
          revealAlternates={session.revealAlternates}
          busy={continuing}
          onContinue={onContinue}
        />
      ) : null}

      {history.length > 0 ? (
        <div className="rounded-[var(--radius)] border border-border bg-bg2/30 p-4">
          <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
            Recent sessions for this problem
          </h3>
          <ul className="mt-3 space-y-2">
            {history.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => reopen(s)}
                  className="flex w-full items-center justify-between gap-3 rounded-md border border-border/80 bg-bg1/40 px-3 py-2 text-left text-sm transition-colors hover:border-accent/35"
                >
                  <span className="truncate text-text">
                    {s.userLogic.slice(0, 80)}
                    {s.userLogic.length > 80 ? "…" : ""}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {new Date(s.createdAt).toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
