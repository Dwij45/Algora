import Link from "next/link";

export default function HomePage() {
  return (
    <div className="animate-fade-in mx-auto max-w-2xl pt-6 sm:pt-12">
      <p className="font-mono text-xs tracking-widest text-accent uppercase">
        problem-solver
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-text sm:text-5xl">
        Your personal DSA learning coach
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        Load a LeetCode problem, describe your approach in plain language, and get
        Socratic feedback — questions first, complexity and alternatives when you
        ask. Local-first, single-user, no judge submission.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/practice"
          className="inline-flex h-11 items-center justify-center rounded-[var(--radius)] bg-accent px-5 text-sm font-semibold text-bg0 transition-colors hover:bg-accent-dim"
        >
          Start practicing
        </Link>
        <Link
          href="/journal"
          className="inline-flex h-11 items-center justify-center rounded-[var(--radius)] border border-border bg-bg2/40 px-5 text-sm text-text transition-colors hover:border-accent/40 hover:bg-bg2"
        >
          Mistake journal
        </Link>
      </div>

      <ul className="mt-12 space-y-3 border-t border-border pt-8 text-sm text-muted">
        <li className="flex gap-3">
          <span className="font-mono text-accent">01</span>
          Fetch problem text and community stats from LeetCode
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-accent">02</span>
          Mentor reviews your logic — not a fake runtime score
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-accent">03</span>
          Log mistakes and unlock strengths / weaknesses over time
        </li>
      </ul>
    </div>
  );
}
