import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  normalizeTopicTag,
  normalizeTopicTags,
} from "@/lib/mistakes/categories";
import { mistakeRowToDto } from "@/lib/mistakes/serialize";

type ProblemTag = { name?: string; slug?: string };

const sessionInclude = {
  session: {
    select: {
      problemSlug: true,
      problem: { select: { title: true, tagsJson: true } },
    },
  },
} as const;

function problemTopicSlugs(tagsJson: string | undefined | null): string[] {
  try {
    const parsed = JSON.parse(tagsJson || "[]") as ProblemTag[];
    if (!Array.isArray(parsed)) return [];
    return normalizeTopicTags(
      parsed.map((t) => t.slug || t.name || "").filter(Boolean),
    );
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || 100, 1),
    200,
  );
  const categoryRaw = searchParams.get("category")?.trim() ?? "";
  const category = categoryRaw ? normalizeTopicTag(categoryRaw) : undefined;

  if (categoryRaw && !category) {
    return NextResponse.json(
      { error: "Invalid topic filter." },
      { status: 400 },
    );
  }

  const rows = await prisma.mistake.findMany({
    where: category
      ? {
          OR: [
            { category },
            { tagsJson: { contains: `"${category}"` } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: sessionInclude,
  });

  // Distinct topics across recent history for filter chips (all-time sample)
  const allCategories = await prisma.mistake.findMany({
    select: { category: true, tagsJson: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const filterTopics = new Set<string>();
  for (const row of allCategories) {
    const c = normalizeTopicTag(row.category);
    if (c) filterTopics.add(c);
    try {
      const tags = JSON.parse(row.tagsJson || "[]") as unknown;
      if (Array.isArray(tags)) {
        for (const t of normalizeTopicTags(
          tags.filter((x): x is string => typeof x === "string"),
        )) {
          filterTopics.add(t);
        }
      }
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    mistakes: rows.map(mistakeRowToDto),
    topics: [...filterTopics].sort(),
  });
}

export async function POST(request: Request) {
  let body: {
    sessionId?: string;
    category?: string;
    note?: string | null;
    tags?: string[];
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim() ?? "";
  const category = normalizeTopicTag(body.category ?? "");
  const note = body.note?.trim() || null;
  const mentorTags = normalizeTopicTags(
    Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === "string")
      : [],
  );

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required." },
      { status: 400 },
    );
  }
  if (!category) {
    return NextResponse.json(
      {
        error:
          "category must be a DSA topic slug (e.g. two_pointers, tree). Syntax-only tags are rejected.",
      },
      { status: 400 },
    );
  }
  if (note && note.length > 2000) {
    return NextResponse.json(
      { error: "note is too long (max 2000 chars)." },
      { status: 400 },
    );
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      problem: { select: { tagsJson: true } },
    },
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  // Two-tag algo: mentor technique + problem LeetCode topics
  const problemTopics = problemTopicSlugs(session.problem?.tagsJson);
  const merged = normalizeTopicTags([
    category,
    ...mentorTags,
    ...problemTopics,
  ]);

  const row = await prisma.mistake.create({
    data: {
      sessionId,
      category,
      note,
      tagsJson: JSON.stringify(merged),
    },
    include: sessionInclude,
  });

  return NextResponse.json({ mistake: mistakeRowToDto(row) }, { status: 201 });
}
