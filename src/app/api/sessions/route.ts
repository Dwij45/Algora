import { NextResponse } from "next/server";
import {
  analysisToOpeningMessage,
  analyzeApproach,
  type SessionMessage,
} from "@/lib/ai/mentor";
import { PROMPT_LIMITS } from "@/lib/ai/limits";
import { MentorAnalysisSchema } from "@/lib/ai/schemas";
import { prisma } from "@/lib/db";
import { getProblemBySlug } from "@/lib/leetcode/cache";
import { sessionRowToDto } from "@/lib/sessions/serialize";
import { sessionInputHash } from "@/lib/utils/hash";
import { normalizeProblemSlug } from "@/lib/utils/slug";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 50);
  const problemSlug = searchParams.get("problemSlug");

  const sessions = await prisma.session.findMany({
    where: problemSlug ? { problemSlug } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { problem: { select: { title: true } } },
  });

  return NextResponse.json({
    sessions: sessions.map(sessionRowToDto),
  });
}

export async function POST(request: Request) {
  let body: {
    problemSlug?: string;
    userLogic?: string;
    userCode?: string | null;
    selfComplexity?: string | null;
    boardImageBase64?: string | null;
    boardImageMime?: string | null;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const slug = normalizeProblemSlug(body.problemSlug ?? "");
  let userLogic = body.userLogic?.trim() ?? "";
  const userCode = body.userCode?.trim() || null;
  const boardImageBase64 = body.boardImageBase64?.trim() || null;
  const boardImageMime = body.boardImageMime?.trim() || "image/png";
  const hasBoard = Boolean(boardImageBase64);

  if (!slug) {
    return NextResponse.json({ error: "problemSlug is required." }, { status: 400 });
  }

  if (hasBoard && boardImageBase64!.length > PROMPT_LIMITS.boardImageBase64) {
    return NextResponse.json(
      {
        error:
          "Board image is too large. Simplify the sketch or turn off Send board.",
      },
      { status: 400 },
    );
  }

  if (!userLogic && hasBoard) {
    userLogic =
      "Approach is sketched on the whiteboard (see attached board image).";
  }

  if (userLogic.length < 20 && !hasBoard) {
    return NextResponse.json(
      { error: "userLogic is too short — describe your approach in a few sentences." },
      { status: 400 },
    );
  }
  if (userLogic.length > PROMPT_LIMITS.userLogic) {
    return NextResponse.json(
      {
        error: `Approach is too long (${userLogic.length} chars). Keep it under ${PROMPT_LIMITS.userLogic} characters — summarize the idea instead of pasting a novel.`,
      },
      { status: 400 },
    );
  }
  if (userCode && userCode.length > PROMPT_LIMITS.userCode) {
    return NextResponse.json(
      {
        error: `Code is too long (${userCode.length} chars). Keep it under ${PROMPT_LIMITS.userCode} characters.`,
      },
      { status: 400 },
    );
  }

  const problemResult = await getProblemBySlug(slug);
  if ("error" in problemResult) {
    return NextResponse.json(
      { error: problemResult.error },
      { status: problemResult.status },
    );
  }
  const problem = problemResult.problem;

  const boardFingerprint = hasBoard
    ? `board:${boardImageBase64!.length}:${boardImageBase64!.slice(0, 32)}:${boardImageBase64!.slice(-32)}`
    : null;

  const inputHash = sessionInputHash({
    problemSlug: slug,
    userLogic,
    userCode,
    boardFingerprint,
  });

  // Reuse identical recent analysis to save LLM calls (skip if board attached — fingerprints are weak).
  if (!hasBoard) {
    const recent = await prisma.session.findFirst({
      where: {
        inputHash,
        problemSlug: slug,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      include: { problem: { select: { title: true } } },
    });

    if (recent) {
      const analysisCheck = MentorAnalysisSchema.safeParse(
        JSON.parse(recent.analysisJson || "{}"),
      );
      if (analysisCheck.success) {
        return NextResponse.json({
          session: sessionRowToDto(recent),
          reused: true,
        });
      }
    }
  }

  let analysis;
  try {
    analysis = await analyzeApproach({
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      contentText: problem.contentText,
      userLogic,
      userCode,
      selfComplexity: body.selfComplexity,
      boardImageBase64,
      boardImageMime,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Mentor analysis failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const now = new Date().toISOString();
  const messages: SessionMessage[] = [
    {
      role: "user",
      content: hasBoard
        ? `${userLogic}\n\n[whiteboard sketch attached]`
        : userLogic,
      at: now,
    },
    {
      role: "assistant",
      content: analysisToOpeningMessage(analysis),
      at: now,
    },
  ];

  const session = await prisma.session.create({
    data: {
      problemSlug: slug,
      userLogic,
      userCode,
      selfComplexity: body.selfComplexity?.trim() || null,
      analysisJson: JSON.stringify(analysis),
      messagesJson: JSON.stringify(messages),
      inputHash,
      status: "analyzed",
      revealAlternates: false,
    },
    include: { problem: { select: { title: true } } },
  });

  return NextResponse.json({ session: sessionRowToDto(session), reused: false });
}
