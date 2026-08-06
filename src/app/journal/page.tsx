export default function JournalPage() {
  return (
    <div className="animate-fade-in max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Mistake journal</h1>
      <p className="mt-2 text-muted">
        Track recurring patterns — missed hashmaps, overused sorting, edge cases,
        and more. Full journal UI ships in Phase 4.
      </p>
      <div className="mt-6 rounded-[var(--radius)] border border-border bg-bg2/50 p-5">
        <p className="text-sm text-muted">No mistakes logged yet.</p>
      </div>
    </div>
  );
}
