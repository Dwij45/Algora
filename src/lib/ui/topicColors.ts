/** Stable pastel tones for topic tags (hash by slug/name). */
const TOPIC_PALETTE = [
  { text: "#7dd3fc", border: "#0ea5e980", bg: "#0ea5e918" }, // sky
  { text: "#c4b5fd", border: "#8b5cf680", bg: "#8b5cf618" }, // violet
  { text: "#6ee7b7", border: "#10b98180", bg: "#10b98118" }, // emerald
  { text: "#fcd34d", border: "#f59e0b80", bg: "#f59e0b18" }, // amber
  { text: "#fda4af", border: "#f43f5e80", bg: "#f43f5e18" }, // rose
  { text: "#67e8f9", border: "#06b6d480", bg: "#06b6d418" }, // cyan
  { text: "#f9a8d4", border: "#ec489980", bg: "#ec489918" }, // pink
  { text: "#a5b4fc", border: "#6366f180", bg: "#6366f118" }, // indigo
  { text: "#fdba74", border: "#f9731680", bg: "#f9731618" }, // orange
  { text: "#bef264", border: "#84cc1680", bg: "#84cc1618" }, // lime
] as const;

function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function topicTone(slugOrName: string) {
  return TOPIC_PALETTE[hashKey(slugOrName.toLowerCase()) % TOPIC_PALETTE.length];
}
