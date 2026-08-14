"use client";

/** Faint scrolling DSA snippets — atmosphere only (aria-hidden). */
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

const LOOP = [...CODE_LINES, ...CODE_LINES, ...CODE_LINES];

const COLUMNS = [
  { className: "left-[-6%] w-[42%] opacity-[0.16] landing-code-scroll", offset: 0 },
  { className: "left-[30%] w-[40%] opacity-[0.14] landing-code-scroll-slow", offset: 9 },
  { className: "right-[-8%] w-[44%] opacity-[0.14] landing-code-scroll-rev", offset: 17 },
] as const;

export function CodeAtmosphereBg() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {COLUMNS.map((col, idx) => {
        const lines = [...LOOP.slice(col.offset), ...LOOP.slice(0, col.offset)];
        return (
          <div
            key={idx}
            className={`absolute inset-y-0 overflow-hidden ${col.className}`}
          >
            <div className="absolute inset-x-0 top-0 font-mono text-[10px] leading-5 text-white sm:text-[11px]">
              {lines.map((line, i) => (
                <div key={`${idx}-${i}`} className="whitespace-pre">
                  {line || " "}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div className="absolute inset-0 bg-linear-to-b from-bg0/85 via-bg0/40 to-bg0/90" />
      <div className="absolute inset-0 bg-linear-to-r from-bg0/55 via-transparent to-bg0/65" />
    </div>
  );
}
