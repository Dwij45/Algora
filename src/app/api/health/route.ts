import { NextResponse } from "next/server";
import { getConfiguredProviderInfo } from "@/lib/ai/provider";
import { prisma } from "@/lib/db";

export async function GET() {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const ai = getConfiguredProviderInfo();

  return NextResponse.json({
    ok: true,
    db: dbOk,
    ai: {
      provider: ai.provider,
      configured: ai.configured,
      model: ai.modelHint,
    },
  });
}
