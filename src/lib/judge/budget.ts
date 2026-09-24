import { prisma } from "@/lib/db";
import { JUDGE_LIMITS } from "./limits";

function utcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export async function assertBudget(kind: "sample" | "submit", extraJudgeCalls: number) {
  const dayKey = utcDayKey();
  const row = await prisma.usageBudget.upsert({
    where: { dayKey },
    create: { dayKey },
    update: {},
  });

  const runCap = kind === "submit" ? JUDGE_LIMITS.submitPerDay : JUDGE_LIMITS.samplePerDay;
  const usedRuns = kind === "submit" ? row.submitCount : row.sampleCount;
  if (usedRuns >= runCap) {
    throw new Error(
      `Daily ${kind} cap reached (${runCap}). Wait until UTC tomorrow or raise JUDGE limits.`,
    );
  }
  if (row.judgeCalls + extraJudgeCalls > JUDGE_LIMITS.judgeCallsPerDay) {
    throw new Error(
      `Daily executor call cap reached (${JUDGE_LIMITS.judgeCallsPerDay}).`,
    );
  }
}

export async function bumpBudget(kind: "sample" | "submit", judgeCalls: number) {
  const dayKey = utcDayKey();
  await prisma.usageBudget.upsert({
    where: { dayKey },
    create: {
      dayKey,
      judgeCalls,
      submitCount: kind === "submit" ? 1 : 0,
      sampleCount: kind === "sample" ? 1 : 0,
    },
    update:
      kind === "submit"
        ? { judgeCalls: { increment: judgeCalls }, submitCount: { increment: 1 } }
        : { judgeCalls: { increment: judgeCalls }, sampleCount: { increment: 1 } },
  });
}
