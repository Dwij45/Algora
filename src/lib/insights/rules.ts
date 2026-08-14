import { topicLabel } from "@/lib/mistakes/categories";
import type {
  InsightCard,
  InsightsPayload,
  TopicCount,
} from "@/lib/insights/types";

export const INSIGHTS_UNLOCK_SESSIONS = 10;
export const WEAKNESS_MIN_COUNT = 3;
export const STRENGTH_MIN_GOOD_RANKS = 3;
export const STRENGTH_MAX_MISTAKES = 1;

export type InsightsSessionRow = {
  analysisJson: string;
  problem?: { tagsJson: string } | null;
};

export type InsightsMistakeRow = {
  category: string;
  tagsJson: string;
};

type Rank = "optimal" | "near" | "suboptimal" | "unknown";

function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((t) => {
        if (typeof t === "string") return t.trim().toLowerCase();
        if (t && typeof t === "object") {
          const o = t as { slug?: string; name?: string };
          return (o.slug || o.name || "").trim().toLowerCase().replace(/\s+/g, "_");
        }
        return "";
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function bump(map: Map<string, number>, key: string, by = 1) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + by);
}

function topEntries(map: Map<string, number>, limit: number): TopicCount[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([topic, count]) => ({ topic, count }));
}

function extractRank(analysisJson: string): Rank {
  try {
    const parsed = JSON.parse(analysisJson || "{}") as {
      compareVsOptimal?: { yourRank?: string };
    };
    const r = parsed.compareVsOptimal?.yourRank;
    if (r === "optimal" || r === "near" || r === "suboptimal") return r;
  } catch {
    // ignore
  }
  return "unknown";
}

function weaknessCard(topic: string, count: number): InsightCard {
  return {
    topic,
    count,
    title: `Difficulty with ${topicLabel(topic)}`,
    detail: `Logged ${count} time${count === 1 ? "" : "s"} as a topic gap. Drill this pattern next.`,
  };
}

function strengthCard(topic: string, count: number): InsightCard {
  return {
    topic,
    count,
    title: `Solid on ${topicLabel(topic)}`,
    detail: `${count} session${count === 1 ? "" : "s"} ranked optimal/near on this topic, with few journaled gaps.`,
  };
}

/**
 * Deterministic Insights from sessions + mistakes (no LLM).
 */
export function computeInsights(input: {
  sessions: InsightsSessionRow[];
  mistakes: InsightsMistakeRow[];
}): InsightsPayload {
  const sessionCount = input.sessions.length;
  const mistakeCount = input.mistakes.length;
  const unlocked = sessionCount >= INSIGHTS_UNLOCK_SESSIONS;

  const mistakeTopics = new Map<string, number>();
  for (const m of input.mistakes) {
    bump(mistakeTopics, m.category.trim().toLowerCase());
    for (const t of parseJsonArray(m.tagsJson)) bump(mistakeTopics, t);
  }

  const goodRankTopics = new Map<string, number>();
  for (const s of input.sessions) {
    const rank = extractRank(s.analysisJson);
    if (rank !== "optimal" && rank !== "near") continue;
    const tags = parseJsonArray(s.problem?.tagsJson ?? "[]");
    for (const t of tags) bump(goodRankTopics, t);
  }

  const topicCounts = topEntries(mistakeTopics, 20);

  if (!unlocked) {
    return {
      unlocked: false,
      sessionCount,
      mistakeCount,
      unlockAtSessions: INSIGHTS_UNLOCK_SESSIONS,
      message: `Keep practicing — insights unlock after ~${INSIGHTS_UNLOCK_SESSIONS} sessions (${sessionCount}/${INSIGHTS_UNLOCK_SESSIONS}).`,
      weaknesses: [],
      strengths: [],
      focusNext: [],
      topicCounts,
    };
  }

  const weaknesses: InsightCard[] = topEntries(mistakeTopics, 50)
    .filter((t) => t.count >= WEAKNESS_MIN_COUNT)
    .slice(0, 8)
    .map((t) => weaknessCard(t.topic, t.count));

  const strengths: InsightCard[] = [];
  for (const { topic, count: goodCount } of topEntries(goodRankTopics, 30)) {
    if (goodCount < STRENGTH_MIN_GOOD_RANKS) continue;
    const misses = mistakeTopics.get(topic) ?? 0;
    if (misses > STRENGTH_MAX_MISTAKES) continue;
    strengths.push(strengthCard(topic, goodCount));
    if (strengths.length >= 6) break;
  }

  const focusNext = weaknesses.slice(0, 3).map((w) => w.topic);

  return {
    unlocked: true,
    sessionCount,
    mistakeCount,
    unlockAtSessions: INSIGHTS_UNLOCK_SESSIONS,
    message:
      weaknesses.length === 0 && strengths.length === 0
        ? "Not enough repeating topic signals yet — keep logging concept gaps after Analyze."
        : null,
    weaknesses,
    strengths,
    focusNext,
    topicCounts,
  };
}
