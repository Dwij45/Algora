"use client";

import type { ProblemApiDto } from "@/lib/leetcode/normalize";
import { Badge, DifficultyBadge } from "@/components/ui/Badge";

function formatAcRate(acRate: number | null): string | null {
  if (acRate == null || !Number.isFinite(acRate)) return null;
  return `${acRate.toFixed(1)}% AC`;
}

function StatementLine({ line }: { line: string }) {
  const trimmed = line.trim();
  const isHeading =
    /^(example\s*\d*|constraints?|note|follow[\s-]?up|input|output|explanation)\b[:]?/i.test(
      trimmed,
    );
  const isBullet = /^[•\-\*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed);

  if (!trimmed) {
    return <div className="h-3" />;
  }

  if (isHeading) {
    return (
      <p className="mt-4 mb-1 text-[15px] font-semibold tracking-wide text-accent">
        {line}
      </p>
    );
  }

  return (
    <p
      className={[
        "text-[15px] leading-7 text-text/90",
        isBullet ? "pl-1 text-text/85" : "",
      ].join(" ")}
    >
      {line}
    </p>
  );
}

/** Left pane — readable problem description with light structure coloring. */
export function ProblemPanel({ problem }: { problem: ProblemApiDto }) {
  const ac = formatAcRate(problem.acRate);
  const lines = problem.contentText.split(/\r?\n/);

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden bg-bg2">
      <header className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-muted">
              {problem.frontendId ? `#${problem.frontendId}` : "—"} ·{" "}
              <span className="text-accent">{problem.slug}</span>
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-text">
              {problem.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <DifficultyBadge difficulty={problem.difficulty} />
            {ac ? <Badge className="text-text">{ac}</Badge> : null}
          </div>
        </div>

        {problem.tags.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {problem.tags.map((tag) => (
              <Badge key={tag.slug}>{tag.name}</Badge>
            ))}
          </div>
        ) : null}

        {problem.warning ? (
          <p className="mt-2 rounded-md border border-warning/30 bg-warning/10 px-2 py-1.5 text-xs text-warning">
            {problem.warning}
          </p>
        ) : null}
      </header>

      <div className="statement-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-prose">
          {lines.map((line, i) => (
            <StatementLine key={`${i}-${line.slice(0, 12)}`} line={line} />
          ))}
        </div>
      </div>
    </article>
  );
}
