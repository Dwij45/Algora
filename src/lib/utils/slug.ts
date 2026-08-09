/**
 * Normalize a LeetCode URL or raw slug to a titleSlug.
 * e.g. "https://leetcode.com/problems/two-sum/" → "two-sum"
 */
export function normalizeProblemSlug(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  try {
    if (raw.includes("leetcode.com") || raw.startsWith("http")) {
      const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      const match = url.pathname.match(/\/problems\/([^/]+)/i);
      if (match?.[1]) {
        return decodeURIComponent(match[1]).toLowerCase().replace(/\/+$/, "");
      }
    }
  } catch {
    // fall through to slug-like parsing
  }

  const cleaned = raw
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/^problems\//i, "")
    .split(/[?#\s]/)[0]
    ?.trim()
    .toLowerCase();

  if (!cleaned) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleaned)) return null;
  return cleaned;
}
