export default function InsightsPage() {
  return (
    <div className="animate-fade-in max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
      <p className="mt-2 text-muted">
        Strengths, weaknesses, and focus topics unlock after enough sessions.
        Rules engine arrives in Phase 5.
      </p>
      <div className="mt-6 rounded-[var(--radius)] border border-border bg-bg2/50 p-5">
        <p className="text-sm text-muted">
          Keep practicing — insights unlock after ~10 sessions.
        </p>
      </div>
    </div>
  );
}
