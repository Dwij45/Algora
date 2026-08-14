import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeInsights } from "@/lib/insights/rules";

export async function GET() {
  const [sessions, mistakes] = await Promise.all([
    prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        analysisJson: true,
        problem: { select: { tagsJson: true } },
      },
    }),
    prisma.mistake.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { 
        category: true,
        tagsJson: true,
      },
    }),
  ]);

  const insights = computeInsights({ sessions, mistakes });
  return NextResponse.json({ insights });
}
