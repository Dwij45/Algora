import { NextResponse } from "next/server";
import { z } from "zod";
import { executeRun } from "@/lib/judge/execute";
import { isRunnerConfigured } from "@/lib/judge/executor-client";
import { isRunnableLanguage } from "@/lib/judge/languages";
import { prisma } from "@/lib/db";
import { runToDto } from "@/lib/judge/serialize";
import { normalizeProblemSlug } from "@/lib/utils/slug";

export const maxDuration = 300;

const BodySchema = z.object({
  problemSlug: z.string().min(1),
  language: z.string().min(1),
  sourceCode: z.string(),
  mode: z.enum(["sample", "submit"]),
  sessionId: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  if (!isRunnerConfigured()) {
    return NextResponse.json(
      { error: "Executor is disabled (EXECUTOR_DISABLED=1)." },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid run payload." }, { status: 400 });
  }

  const slug = normalizeProblemSlug(parsed.data.problemSlug);
  if (!slug) {
    return NextResponse.json({ error: "problemSlug is required." }, { status: 400 });
  }
  if (!isRunnableLanguage(parsed.data.language)) {
    return NextResponse.json(
      { error: "Language must be python, java, cpp, or javascript." },
      { status: 400 },
    );
  }

  try {
    const run = await executeRun({
      problemSlug: slug,
      language: parsed.data.language,
      sourceCode: parsed.data.sourceCode,
      mode: parsed.data.mode,
      sessionId: parsed.data.sessionId,
    });
    return NextResponse.json({ run });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Run failed.";
    const run = (err as { run?: unknown }).run;
    return NextResponse.json(run ? { error: message, run } : { error: message }, { status });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("problemSlug");
  const runs = await prisma.run.findMany({
    where: slug ? { problemSlug: slug } : undefined,
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { cases: true },
  });
  return NextResponse.json({ runs: runs.map((row) => runToDto(row)) });
}
