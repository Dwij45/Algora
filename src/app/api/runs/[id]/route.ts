import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runToDto } from "@/lib/judge/serialize";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const run = await prisma.run.findUnique({
    where: { id },
    include: { cases: true },
  });
  if (!run) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }
  return NextResponse.json({ run: runToDto(run) });
}
