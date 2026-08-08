import { NextResponse } from "next/server";
import { continueMentorship, type SessionMessage } from "@/lib/ai/mentor";
import { MentorAnalysisSchema } from "@/lib/ai/schemas";
import { prisma } from "@/lib/db";
import { sessionRowToDto } from "@/lib/sessions/serialize";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let body: { message?: string; revealAlternates?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  const revealAlternates = Boolean(body.revealAlternates);

  if (!message && !revealAlternates) {
    return NextResponse.json(
      { error: "Provide a message and/or revealAlternates: true." },
      { status: 400 },
    );
  }

  const existing = await prisma.session.findUnique({
    where: { id },
    include: { problem: true },
  });

  if (!existing || !existing.problem) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  let analysis;
  try {
    analysis = MentorAnalysisSchema.parse(JSON.parse(existing.analysisJson || "{}"));
  } catch {
    return NextResponse.json(
      { error: "Session analysis is corrupted; start a new analysis." },
      { status: 500 },
    );
  }

  const history = (() => {
    try {
      return JSON.parse(existing.messagesJson || "[]") as SessionMessage[];
    } catch {
      return [] as SessionMessage[];
    }
  })();

  const userContent =
    message ||
    (revealAlternates
      ? "Please reveal alternate approaches and compare versus optimal."
      : "");

  let assistantText: string;
  try {
    assistantText = await continueMentorship({
      title: existing.problem.title,
      slug: existing.problem.slug,
      analysis,
      history,
      userMessage: userContent,
      revealAlternates: revealAlternates || existing.revealAlternates,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Continue failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const at = new Date().toISOString();
  const nextMessages: SessionMessage[] = [
    ...history,
    { role: "user", content: userContent, at },
    { role: "assistant", content: assistantText.trim(), at },
  ].slice(-24);

  const updated = await prisma.session.update({
    where: { id },
    data: {
      messagesJson: JSON.stringify(nextMessages),
      revealAlternates: existing.revealAlternates || revealAlternates,
      status: "continued",
    },
    include: { problem: { select: { title: true } } },
  });

  return NextResponse.json({ session: sessionRowToDto(updated) });
}
