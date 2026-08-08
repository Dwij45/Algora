import type { ProblemApiDto } from "@/lib/leetcode/normalize";
import { Badge, DifficultyBadge } from "@/components/ui/Badge";

function formatAcRate(acRate: number | null): string | null {
  if (acRate == null || !Number.isFinite(acRate)) return null;
  return `${acRate.toFixed(1)}% AC`;
}

/** Left pane — LeetCode-style problem statement (scrollable, roomy). */
export function ProblemPanel({ problem }: { problem: ProblemApiDto }) {
  const ac = formatAcRate(problem.acRate);

  return (
    <article className="animate-fade-in flex h-full min-h-0 flex-col rounded-[var(--radius)] border border-border bg-bg2/60">
      <header className="shrink-0 border-b border-border px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted">
              {problem.frontendId ? `#${problem.frontendId}` : "—"} ·{" "}
              <span className="text-accent">{problem.slug}</span>
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-text sm:text-2xl">
              {problem.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={problem.difficulty} />
            {ac ? <Badge className="text-text">{ac}</Badge> : null}
          </div>
        </div>

        {problem.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {problem.tags.map((tag) => (
              <Badge key={tag.slug}>{tag.name}</Badge>
            ))}
          </div>
        ) : null}

        {problem.warning ? (
          <p className="mt-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            {problem.warning}
          </p>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        <pre className="whitespace-pre-wrap font-sans text-[15px] leading-7 text-text/90">
          {problem.contentText}
        </pre>
      </div>
    </article>
  );
}
