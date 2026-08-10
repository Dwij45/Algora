"use client";

import type { MentorAnalysis } from "@/lib/ai/schemas";
import { LogMistakeControl } from "@/components/journal/LogMistakeControl";

type MentorPanelProps = {
  analysis: MentorAnalysis | null;
  revealAlternates: boolean;
  loading?: boolean;
  error?: string | null;
  footer?: React.ReactNode;
  sessionId?: string | null;
};

/** Bottom mentor pane — card grid like a feedback console. */
export function MentorPanel({
  analysis,
  revealAlternates,
  loading,
  error,
  footer,
  sessionId,
}: MentorPanelProps) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-bg1">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold tracking-tight">Mentor</h2>
        <span className="font-mono text-[10px] tracking-wide text-muted uppercase">
          feedback
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {loading ? (
          <p className="animate-fade-in text-sm text-muted">
            Thinking with the mentor…
          </p>
        ) : error ? (
          <MentorCard tone="danger" title="Error">
            <p className="text-sm text-danger">{error}</p>
          </MentorCard>
        ) : !analysis ? (
          <MentorCard tone="muted" title="Ready when you are">
            <p className="text-sm text-muted">
              Write in Notes or Code, then hit Analyze. Feedback lands here as
              cards.
            </p>
          </MentorCard>
        ) : (
          <div className="animate-fade-in grid gap-3 sm:grid-cols-2">
            <MentorCard
              title="Socratic questions"
              tone="accent"
              className="sm:col-span-2"
            >
              <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-text/95">
                {analysis.socraticQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ol>
            </MentorCard>

            <MentorCard
              title="What I understood"
              tone="neutral"
              className="sm:col-span-2"
            >
              <p className="text-sm leading-relaxed text-text/90">
                {analysis.understoodApproach}
              </p>
            </MentorCard>

            <MentorCard title="Strengths" tone="ok">
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
            </MentorCard>

            <MentorCard title="Estimated complexity" tone="accent">
              <p className="font-mono text-sm text-accent">
                time {analysis.estimatedComplexity.time} · space{" "}
                {analysis.estimatedComplexity.space}
              </p>
              <p className="mt-1.5 text-sm text-muted">
                {analysis.estimatedComplexity.rationale}
              </p>
            </MentorCard>

            <MentorCard
              title="Missed observations"
              tone="warning"
              className="sm:col-span-2"
            >
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
            </MentorCard>

            {analysis.hintLevel1 ? (
              <MentorCard title="Gentle hint" tone="muted" className="sm:col-span-2">
                <p className="text-sm text-muted">{analysis.hintLevel1}</p>
              </MentorCard>
            ) : null}

            <MentorCard
              title="Topic gaps"
              tone="warning"
              className="sm:col-span-2"
            >
              {sessionId ? (
                <LogMistakeControl
                  sessionId={sessionId}
                  suggestedTags={analysis.suggestedMistakeTags}
                />
              ) : (
                <p className="text-sm text-muted">
                  Analyze first to unlock Log on topic tags.
                </p>
              )}
            </MentorCard>

            <details
              key={revealAlternates ? "revealed" : "hidden"}
              className="group sm:col-span-2 rounded-lg border border-border bg-bg-elevated/60 open:border-accent/40"
              open={revealAlternates || undefined}
            >
              <summary className="cursor-pointer list-none px-3.5 py-2.5 text-sm font-medium text-text marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="text-muted group-open:hidden">
                  {revealAlternates
                    ? "Alternates / Compare — click to expand"
                    : "Alternates / Compare — press Reveal first"}
                </span>
                <span className="hidden text-accent group-open:inline">
                  Alternates / Compare
                </span>
              </summary>
              <div className="space-y-3 border-t border-border px-3.5 py-3">
                {!revealAlternates ? (
                  <p className="text-xs text-muted">
                    Press Reveal in the footer to unlock this layer.
                  </p>
                ) : (
                  <>
                    <MentorCard title="Compare vs optimal" tone="accent">
                      <p className="font-mono text-xs text-accent">
                        rank: {analysis.compareVsOptimal.yourRank}
                      </p>
                      <p className="mt-1 text-sm text-text/90">
                        {analysis.compareVsOptimal.gap}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {analysis.compareVsOptimal.whyFaster}
                      </p>
                    </MentorCard>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {analysis.alternateApproaches.map((a) => (
                        <MentorCard key={a.name} title={a.name} tone="neutral">
                          <p className="text-sm text-muted">{a.idea}</p>
                          <p className="mt-1.5 font-mono text-xs text-accent">
                            {a.time} / {a.space}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            When: {a.whenToUse}
                          </p>
                        </MentorCard>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </details>
          </div>
        )}
      </div>

      {footer ? (
        <div className="shrink-0 border-t border-border px-3 py-2">{footer}</div>
      ) : null}
    </section>
  );
}

const TONE_BORDER: Record<string, string> = {
  accent: "border-accent/25",
  ok: "border-ok/35",
  warning: "border-warning/35",
  danger: "border-danger/35",
  muted: "border-border",
  neutral: "border-border",
};

const TONE_TITLE: Record<string, string> = {
  accent: "text-accent/80",
  ok: "text-ok/80",
  warning: "text-yellow-400/80 uppercase",
  danger: "text-danger/80",
  muted: "text-muted/80",
  neutral: "text-muted/80",
};

function MentorCard({
  title,
  children,
  tone = "neutral",
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  tone?: keyof typeof TONE_BORDER;
  className?: string;
}) {
  return (
    <article
      className={[
        "rounded-lg border bg-bg-elevated/50 px-3.5 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
        TONE_BORDER[tone] ?? TONE_BORDER.neutral,
        className,
      ].join(" ")}
    >
      <h3
        className={[
          "mb-2 text-[11px] font-semibold tracking-wide uppercase",
          TONE_TITLE[tone] ?? TONE_TITLE.neutral,
        ].join(" ")}
      >
        {title}
      </h3>
      {children}
    </article>
  );
}
