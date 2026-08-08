import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sessionRowToDto } from "@/lib/sessions/serialize";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await prisma.session.findUnique({
    where: { id },
    include: { problem: { select: { title: true } } },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json({ session: sessionRowToDto(session) });
}
