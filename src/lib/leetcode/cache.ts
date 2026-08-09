import { prisma } from "@/lib/db";
import {
  fetchQuestionBySlug,
  LeetCodeRequestError,
  searchQuestions,
} from "./client";
import {
  normalizeQuestion,
  normalizeSearchItem,
  problemRowToDto,
  type NormalizedSearchItem,
  type ProblemApiDto,
} from "./normalize";

function cacheTtlMs(): number {
  const hours = Number(process.env.PROBLEM_CACHE_TTL_HOURS ?? "24");
  const safe = Number.isFinite(hours) && hours > 0 ? hours : 24;
  return safe * 60 * 60 * 1000;
}

function isFresh(cachedAt: Date): boolean {
  return Date.now() - cachedAt.getTime() < cacheTtlMs();
}

export async function getProblemBySlug(
  slug: string,
): Promise<{ problem: ProblemApiDto } | { error: string; status: number }> {
  const existing = await prisma.problem.findUnique({ where: { slug } });

  if (existing && isFresh(existing.cachedAt)) {
    return { problem: problemRowToDto(existing) };
  }

  try {
    const raw = await fetchQuestionBySlug(slug);
    if (!raw) {
      if (existing) {
        return {
          problem: problemRowToDto(existing, {
            stale: true,
            warning: "Problem not found on LeetCode; showing cached copy.",
          }),
        };
      }
      return { error: `Problem "${slug}" not found on LeetCode.`, status: 404 };
    }

    const normalized = normalizeQuestion(raw);
    const row = await prisma.problem.upsert({
      where: { slug: normalized.slug },
      create: {
        slug: normalized.slug,
        frontendId: normalized.frontendId,
        title: normalized.title,
        difficulty: normalized.difficulty,
        contentHtml: normalized.contentHtml,
        contentText: normalized.contentText,
        tagsJson: JSON.stringify(normalized.tags),
        statsJson: JSON.stringify(normalized.stats),
        acRate: normalized.acRate,
        similarJson: JSON.stringify(normalized.similar),
        cachedAt: new Date(),
      },
      update: {
        frontendId: normalized.frontendId,
        title: normalized.title,
        difficulty: normalized.difficulty,
        contentHtml: normalized.contentHtml,
        contentText: normalized.contentText,
        tagsJson: JSON.stringify(normalized.tags),
        statsJson: JSON.stringify(normalized.stats),
        acRate: normalized.acRate,
        similarJson: JSON.stringify(normalized.similar),
        cachedAt: new Date(),
      },
    });

    return { problem: problemRowToDto(row) };
  } catch (err) {
    const message =
      err instanceof LeetCodeRequestError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to fetch problem from LeetCode";

    if (existing) {
      return {
        problem: problemRowToDto(existing, {
          stale: true,
          warning: `LeetCode unreachable (${message}). Showing cached copy.`,
        }),
      };
    }

    return { error: message, status: 502 };
  }
}

export async function searchProblems(
  q: string,
  limit = 20,
): Promise<
  | { questions: NormalizedSearchItem[]; total: number }
  | { error: string; status: number }
> {
  const keyword = q.trim();
  if (!keyword) {
    return { questions: [], total: 0 };
  }

  try {
    const { total, questions } = await searchQuestions(keyword, limit);
    return {
      total,
      questions: questions.map(normalizeSearchItem),
    };
  } catch (err) {
    const message =
      err instanceof LeetCodeRequestError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to search LeetCode";
    return { error: message, status: 502 };
  }
}
