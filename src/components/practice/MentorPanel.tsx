"use client";

import type { MentorAnalysis } from "@/lib/ai/schemas";
import { Badge } from "@/components/ui/Badge";

type MentorPanelProps = {
  analysis: MentorAnalysis | null;
  revealAlternates: boolean;
  loading?: boolean;
  error?: string | null;
};

export function MentorPanel({
  analysis,
  revealAlternates,
  loading,
  error,
}: MentorPanelProps) {
  if (loading) {
    return (
      <Shell>
        <p className="animate-fade-in text-sm text-muted">
          Thinking with the mentor…
        </p>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      </Shell>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Shell>
      <div className="animate-fade-in space-y-6">
        <Section title="Socratic questions">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-text/95">
            {analysis.socraticQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </Section>

        <Section title="What I understood">
          <p className="text-sm leading-relaxed text-text/90">
            {analysis.understoodApproach}
          </p>
        </Section>

        <div className="grid gap-6 sm:grid-cols-2">
          <Section title="Strengths">
            {analysis.strengths.length === 0 ? (
              <p className="text-sm text-muted">None noted yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm text-text/90">
                {analysis.strengths.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="text-ok">+</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Estimated complexity">
            <p className="font-mono text-sm text-accent">
              time {analysis.estimatedComplexity.time} · space{" "}
              {analysis.estimatedComplexity.space}
            </p>
            <p className="mt-1 text-sm text-muted">
              {analysis.estimatedComplexity.rationale}
            </p>
          </Section>
        </div>

        <Section title="Missed observations">
          {analysis.missedObservations.length === 0 ? (
            <p className="text-sm text-muted">Looking solid so far.</p>
          ) : (
            <ul className="space-y-1.5 text-sm text-text/90">
              {analysis.missedObservations.map((m) => (
                <li key={m} className="flex gap-2">
                  <span className="text-warning">·</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {analysis.hintLevel1 ? (
          <Section title="Gentle hint">
            <p className="text-sm text-muted">{analysis.hintLevel1}</p>
          </Section>
        ) : null}

        {analysis.suggestedMistakeTags.length > 0 ? (
          <Section title="Possible mistake tags">
            <div className="flex flex-wrap gap-1.5">
              {analysis.suggestedMistakeTags.map((t) => (
                <Badge key={t} className="font-mono text-warning">
                  {t}
                </Badge>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Logging to the journal lands in Phase 4.
            </p>
          </Section>
        ) : null}

        <details
          className="group rounded-[var(--radius)] border border-border bg-bg1/50 open:border-accent/30"
          open={revealAlternates}
        >
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-text marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="text-muted group-open:hidden">
              Alternates / Compare — collapsed until you reveal
            </span>
            <span className="hidden text-accent group-open:inline">
              Alternates / Compare
            </span>
          </summary>
          <div className="space-y-4 border-t border-border px-3 py-3">
            {!revealAlternates ? (
              <p className="text-xs text-muted">
                Use “Reveal alternates” below when you want this layer.
              </p>
            ) : null}

            <div>
              <h4 className="text-xs font-semibold tracking-wide text-muted uppercase">
                Compare vs optimal
              </h4>
              <p className="mt-1 font-mono text-xs text-accent">
                rank: {analysis.compareVsOptimal.yourRank}
              </p>
              <p className="mt-1 text-sm text-text/90">
                {analysis.compareVsOptimal.gap}
              </p>
              <p className="mt-1 text-sm text-muted">
                {analysis.compareVsOptimal.whyFaster}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold tracking-wide text-muted uppercase">
                Alternate approaches
              </h4>
              <ul className="mt-2 space-y-3">
                {analysis.alternateApproaches.map((a) => (
                  <li
                    key={a.name}
                    className="rounded-md border border-border/80 bg-bg2/40 px-3 py-2"
                  >
                    <p className="text-sm font-medium text-text">{a.name}</p>
                    <p className="mt-1 text-sm text-muted">{a.idea}</p>
                    <p className="mt-1 font-mono text-xs text-accent">
                      {a.time} / {a.space}
                    </p>
                    <p className="mt-1 text-xs text-muted">When: {a.whenToUse}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius)] border border-border bg-bg2/60">
      <header className="border-b border-border px-4 py-4 sm:px-5">
        <h2 className="text-lg font-semibold tracking-tight">Mentor</h2>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}
