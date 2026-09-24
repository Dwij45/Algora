import { NextResponse } from "next/server";
import { getConfiguredProviderInfo } from "@/lib/ai/provider";
import { prisma } from "@/lib/db";
import { isRunnerConfigured } from "@/lib/judge/executor-client";

async function runnerReachable(): Promise<boolean> {
  const base = (
    process.env.EXECUTOR_URL?.trim() || "http://127.0.0.1:2000/api/v2"
  ).replace(/\/$/, "");
  const health = `${base.replace(/\/api\/v2$/, "")}/health`;
  try {
    const res = await fetch(health, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const ai = getConfiguredProviderInfo();
  const configured = isRunnerConfigured();

  return NextResponse.json({
    ok: true,
    db: dbOk,
    ai: {
      provider: ai.provider,
      configured: ai.configured,
      model: ai.modelHint,
    },
    executor: configured,
    executorReachable: configured ? await runnerReachable() : false,
  });
}
