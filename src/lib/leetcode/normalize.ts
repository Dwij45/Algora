import { htmlToText } from "@/lib/utils/htmlToText";
import type { LeetCodeQuestionRaw, LeetCodeSearchItemRaw } from "./client";

export type TopicTag = { name: string; slug: string };

export type NormalizedSearchItem = {
  frontendId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  acRate: number | null;
  topicTags: TopicTag[];
};

export type NormalizedProblem = {
  slug: string;
  frontendId: string | null;
  title: string;
  difficulty: string;
  contentHtml: string | null;
  contentText: string;
  tags: TopicTag[];
  stats: Record<string, unknown>;
  acRate: number | null;
  similar: unknown[];
  sampleTestCase: string | null;
  hints: string[];
};

function parseJsonSafe<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function extractAcRate(stats: Record<string, unknown>): number | null {
  const candidates = [
    stats.acRate,
    stats.ac_rate,
    stats.totalAcceptedRaw != null && stats.totalSubmissionRaw != null
      ? (Number(stats.totalAcceptedRaw) / Number(stats.totalSubmissionRaw)) * 100
      : null,
  ];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return c;
    if (typeof c === "string") {
      const n = parseFloat(c.replace("%", ""));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

export function normalizeSearchItem(
  raw: LeetCodeSearchItemRaw,
): NormalizedSearchItem {
  const frontendId = String(
    raw.frontendQuestionId ?? raw.questionFrontendId ?? "",
  );
  return {
    frontendId,
    title: raw.title,
    titleSlug: raw.titleSlug,
    difficulty: raw.difficulty,
    acRate:
      typeof raw.acRate === "number" && Number.isFinite(raw.acRate)
        ? raw.acRate
        : null,
    topicTags: (raw.topicTags ?? []).map((t) => ({
      name: t.name,
      slug: t.slug,
    })),
  };
}

export function normalizeQuestion(raw: LeetCodeQuestionRaw): NormalizedProblem {
  const contentHtml = raw.content;
  const contentText = contentHtml
    ? htmlToText(contentHtml)
    : "This problem statement is unavailable (paid-only or empty content).";

  const stats = parseJsonSafe<Record<string, unknown>>(raw.stats, {});
  const similar = parseJsonSafe<unknown[]>(raw.similarQuestions, []);
  const hints = Array.isArray(raw.hints) ? raw.hints.filter(Boolean) : [];

  return {
    slug: raw.titleSlug,
    frontendId: raw.questionFrontendId ? String(raw.questionFrontendId) : null,
    title: raw.title,
    difficulty: raw.difficulty,
    contentHtml,
    contentText,
    tags: (raw.topicTags ?? []).map((t) => ({ name: t.name, slug: t.slug })),
    stats,
    acRate: extractAcRate(stats),
    similar,
    sampleTestCase: raw.sampleTestCase ?? null,
    hints,
  };
}

export type ProblemApiDto = {
  id: string;
  slug: string;
  frontendId: string | null;
  title: string;
  difficulty: string;
  contentHtml: string | null;
  contentText: string;
  tags: TopicTag[];
  stats: Record<string, unknown>;
  acRate: number | null;
  similar: unknown[];
  cachedAt: string;
  updatedAt: string;
  stale?: boolean;
  warning?: string;
};

export function problemRowToDto(
  row: {
    id: string;
    slug: string;
    frontendId: string | null;
    title: string;
    difficulty: string;
    contentHtml: string | null;
    contentText: string;
    tagsJson: string;
    statsJson: string;
    acRate: number | null;
    similarJson: string;
    cachedAt: Date;
    updatedAt: Date;
  },
  extra?: { stale?: boolean; warning?: string },
): ProblemApiDto {
  return {
    id: row.id,
    slug: row.slug,
    frontendId: row.frontendId,
    title: row.title,
    difficulty: row.difficulty,
    contentHtml: row.contentHtml,
    contentText: row.contentText,
    tags: parseJsonSafe<TopicTag[]>(row.tagsJson, []),
    stats: parseJsonSafe<Record<string, unknown>>(row.statsJson, {}),
    acRate: row.acRate,
    similar: parseJsonSafe<unknown[]>(row.similarJson, []),
    cachedAt: row.cachedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...extra,
  };
}
