"use client";

import Link from "next/link";

const CODE_LINES = [
  "function twoSum(nums, target) {",
  "  const map = new Map();",
  "  for (let i = 0; i < nums.length; i++) {",
  "    const need = target - nums[i];",
  "    if (map.has(need)) return [map.get(need), i];",
  "    map.set(nums[i], i);",
  "  }",
  "}",
  "// approach: hash lookup O(n)",
  "let left = 0, right = n - 1;",
  "while (left < right) {",
  "  const sum = a[left] + a[right];",
  "  if (sum === target) break;",
  "  if (sum < target) left++;",
  "  else right--;",
  "}",
  "dfs(node) {",
  "  if (!node) return;",
  "  visit(node);",
  "  dfs(node.left);",
  "  dfs(node.right);",
  "}",
  "dp[i] = Math.max(dp[i-1], dp[i-2] + nums[i]);",
  "// mentor: what repeats? invariant?",
  "const seen = new Set();",
  "queue.push(root);",
  "while (queue.length) {",
  "  const cur = queue.shift();",
  "  for (const nxt of cur.adj) {",
  "    if (!seen.has(nxt)) queue.push(nxt);",
  "  }",
  "}",
  "binarySearch(lo, hi, pred);",
  "union(a, b); find(x);",
  "// Algora — think before you code",
];

function CodeFace() {
  const dense = Array.from({ length: 8 }, () => CODE_LINES).flat();

  return (
    <div
      className="landing-code-face pointer-events-none absolute top-[22%] left-[4%] h-[min(58vh,28rem)] w-[min(48vw,20rem)] sm:left-[8%] sm:w-[min(42vw,22rem)]"
      aria-hidden
    >
      <div className="landing-code-face-scroll absolute inset-0 font-mono text-[9px] leading-[1.15] text-white/55 sm:text-[10px]">
        {dense.map((line, i) => (
          <div key={`face-${i}`} className="whitespace-pre">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandingHero() {
  const loop = [...CODE_LINES, ...CODE_LINES, ...CODE_LINES];

  return (
    <section className="landing-hero relative isolate min-h-[calc(100vh-3.5rem)] overflow-hidden bg-bg0">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 0%, #0f0f0f 75%)",
        }}
      />

      <CodeFace />

      <div
        className="landing-face-glow pointer-events-none absolute top-[26%] left-[6%] h-[min(40vh,16rem)] w-[min(36vw,14rem)] rounded-full sm:left-[10%]"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-y-0 left-[42%] hidden w-[min(22rem,32vw)] overflow-hidden lg:block"
        aria-hidden
      >
        <div className="landing-code-scroll absolute inset-x-0 top-0 font-mono text-[11px] leading-5 text-white/[0.10]">
          {loop.map((line, i) => (
            <div key={`col-${i}`} className="whitespace-pre">
              {line || " "}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-linear-to-b from-bg0 via-transparent to-bg0" />
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-3.5rem)] flex-col justify-between px-5 pb-10 pt-10 sm:px-10 sm:pb-14 sm:pt-14 lg:px-16">
        <div className="landing-fade-1 max-w-5xl">
          <p className="font-mono text-[11px] tracking-[0.28em] text-accent uppercase">
            Local-first DSA coach
          </p>
          <h1 className="landing-title mt-4 text-[clamp(3.2rem,14vw,9.5rem)] font-semibold tracking-[-0.06em] text-white uppercase">
            Algora
          </h1>
        </div>

        <div className="landing-fade-2 mt-auto flex max-w-xl flex-col gap-8 sm:ml-auto sm:items-end sm:text-right">
          <div className="space-y-3 font-mono text-[11px] tracking-[0.12em] text-white/55 uppercase sm:text-xs">
            <p>/ Think the approach before the code</p>
            <p>/ Socratic mentor · topic journal · insights</p>
            <p className="text-white/80">We coach problem-solvers</p>
          </div>
          <p className="max-w-md text-base leading-relaxed text-white/65 sm:text-lg">
            Sketch logic, get questions first — not a fake runtime score.
          </p>
          <div className="flex flex-wrap gap-3 sm:justify-end">
            <Link
              href="/practice"
              className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-sm font-semibold text-bg0 transition-transform hover:bg-accent-dim active:scale-[0.98]"
            >
              Start practicing
            </Link>
            <Link
              href="/insights"
              className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 bg-white/5 px-6 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-accent"
            >
              View insights
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-[10px] tracking-wide text-white/40 sm:justify-end">
            <span className="rounded border border-white/15 px-2 py-1">
              ^P Practice
            </span>
            <span className="rounded border border-white/15 px-2 py-1">
              ^J Journal
            </span>
            <span className="rounded border border-white/15 px-2 py-1">
              ^I Insights
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
