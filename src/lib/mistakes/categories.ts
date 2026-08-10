/**
 * Topic tags for the mistake journal (DSA topics / techniques).
 * Not a hard enum — any normalized topic string is allowed.
 * Behavioral labels (missed_hashmap, etc.) are retired.
 */

export const MAX_TOPIC_TAG_LEN = 40;

/** Example seeds for empty UI hints only — not an allowlist. */
export const COMMON_TOPIC_SEEDS = [
  "array",
  "string",
  "hash_table",
  "two_pointers",
  "sliding_window",
  "binary_search",
  "stack",
  "queue",
  "linked_list",
  "tree",
  "binary_tree",
  "bst",
  "graph",
  "bfs",
  "dfs",
  "heap",
  "dp",
  "greedy",
  "backtracking",
  "math",
  "bit_manipulation",
  "union_find",
  "trie",
  "sorting",
  "recursion",
] as const;

/** Phrases that look like syntax / non-conceptual noise — drop from mentor tags. */
const SYNTAX_NOISE = [
  "syntax",
  "typo",
  "semicolon",
  "compile",
  "compiler",
  "runtime_error",
  "null_pointer",
  "undefined",
  "language_api",
  "api_recall",
  "forgot_syntax",
  "missing_brace",
  "import_error",
];

/**
 * Normalize a topic tag: lowercase, underscores, strip junk, max length.
 * Returns null if empty or looks like syntax noise.
 */
export function normalizeTopicTag(raw: string): string | null {
  let t = raw.trim().toLowerCase();
  t = t.replace(/[\s\-]+/g, "_");
  t = t.replace(/[^a-z0-9_]/g, "");
  t = t.replace(/_+/g, "_").replace(/^_|_$/g, "");
  if (!t || t.length > MAX_TOPIC_TAG_LEN) return null;
  if (SYNTAX_NOISE.some((n) => t === n || t.includes(n))) return null;
  return t;
}

export function normalizeTopicTags(tags: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags) {
    const n = normalizeTopicTag(raw);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

/** Display: two_pointers → Two pointers */
export function topicLabel(tag: string): string {
  return tag
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** @deprecated Use normalizeTopicTag — kept so old imports don't break mid-refactor */
export const MISTAKE_CATEGORIES = COMMON_TOPIC_SEEDS;
export type MistakeCategory = (typeof COMMON_TOPIC_SEEDS)[number];
export const MISTAKE_CATEGORY_SET = new Set<string>(COMMON_TOPIC_SEEDS);
export const MISTAKE_CATEGORY_LABELS = Object.fromEntries(
  COMMON_TOPIC_SEEDS.map((c) => [c, topicLabel(c)]),
) as Record<MistakeCategory, string>;

export function isMistakeCategory(value: string): boolean {
  return normalizeTopicTag(value) !== null;
}

export function categoryLabel(category: string): string {
  return topicLabel(category);
}
