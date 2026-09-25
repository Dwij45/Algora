import { prisma } from "@/lib/db";
import { sha256Hex } from "@/lib/utils/hash";
import { JUDGE_LIMITS } from "./limits";
import { outputsMatch } from "./compare";
import { isRunnableLanguage, type RunnableLanguage } from "./languages";
import { submitBatch, type ExecutorResult } from "./executor-client";
import { prepareSubmission } from "./wrap";
import { assertBudget, bumpBudget } from "./budget";
import { syncCatalogForSlug } from "./sync";
import { runToDto, type RunDto } from "./serialize";

export { runToDto };
export type { RunDto };

function caseVerdict(result: ExecutorResult, expected: string, compareMode: string): string {
  if (result.statusId === 6) return "ce";
  if (result.statusId === 5) return "tle";
  if (result.statusId === 3) {
    return outputsMatch(expected, result.stdout, compareMode) ? "passed" : "failed";
  }
  if (result.statusId > 3) return "re";
  return "error";
}

function rollup(statuses: string[]): string {
  if (statuses.some((s) => s === "ce")) return "CE";
  if (statuses.some((s) => s === "tle")) return "TLE";
  if (statuses.some((s) => s === "re" || s === "error")) return "RE";
  if (statuses.some((s) => s === "failed")) return "WA";
  if (statuses.length > 0 && statuses.every((s) => s === "passed")) return "AC";
  return "RE";
}

export async function executeRun(input: {
  problemSlug: string;
  language: string;
  sourceCode: string;
  mode: "sample" | "submit";
  sessionId?: string | null;
}): Promise<RunDto> {
  if (!isRunnableLanguage(input.language)) {
    throw Object.assign(new Error("Pick Python, Java, C++, or JavaScript."), { status: 400 });
  }
  const language: RunnableLanguage = input.language;
  const source = input.sourceCode.trim();
  if (source.length < 4) {
    throw Object.assign(new Error("Write some code first."), { status: 400 });
  }
  if (source.length > JUDGE_LIMITS.sourceChars) {
    throw Object.assign(
      new Error(`Code is too long (${source.length}). Keep it under ${JUDGE_LIMITS.sourceChars}.`),
      { status: 400 },
    );
  }

  const spec = await syncCatalogForSlug(input.problemSlug);
  if (!spec) {
    throw Object.assign(
      new Error("No curated tests for this problem yet. Try two-sum or valid-parentheses."),
      { status: 400 },
    );
  }

  const tests = await prisma.problemTestCase.findMany({
    where: {
      problemSlug: input.problemSlug,
      visibility: input.mode === "sample" ? "sample" : undefined,
    },
    orderBy: { ordinal: "asc" },
    take: JUDGE_LIMITS.maxTestsPerRun,
  });
  if (tests.length === 0) {
    throw Object.assign(new Error("No tests found for this run."), { status: 400 });
  }

  const inputHash = sha256Hex(
    `${input.problemSlug}\n${language}\n${input.mode}\n${source}`,
  );
  const recent = await prisma.run.findFirst({
    where: {
      inputHash,
      createdAt: { gte: new Date(Date.now() - JUDGE_LIMITS.idempotencyWindowMs) },
      status: "done",
    },
    include: { cases: true },
    orderBy: { createdAt: "desc" },
  });
  if (recent) return runToDto(recent);

  await assertBudget(input.mode, tests.length);

  let prepared;
  try {
    prepared = tests.map((test) =>
      prepareSubmission({
        language,
        source,
        entryName: spec.entryName,
        stdinJson: test.stdin,
      }),
    );
  } catch (err) {
    throw Object.assign(
      new Error(err instanceof Error ? err.message : "Could not wrap source."),
      { status: 400 },
    );
  }

  const run = await prisma.run.create({
    data: {
      problemSlug: input.problemSlug,
      sessionId: input.sessionId ?? null,
      language,
      sourceCode: source,
      mode: input.mode,
      status: "running",
      inputHash,
    },
  });

  let results: ExecutorResult[];
  try {
    results = await submitBatch(
      prepared.map((item) => ({
        language,
        source: item.source,
        stdin: item.stdin,
      })),
    );
    await bumpBudget(input.mode, results.length);
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Executor request failed.";
    const message = /fetch failed|ECONNREFUSED|Failed to fetch/i.test(raw)
      ? "Runner is not reachable. Start algora-runner (Docker) or set EXECUTOR_DISABLED=1."
      : raw;
    const failed = await prisma.run.update({
      where: { id: run.id },
      data: { status: "error", error: message, verdict: "IE" },
      include: { cases: true },
    });
    throw Object.assign(new Error(message), { status: 502, run: runToDto(failed) });
  }

  // prisma.$transaction writes one RunCase row per test (stdin, stdout, expected, status, time). Then the Run row is updated: status: "done", verdict: "AC".

  const statuses: string[] = [];
  await prisma.$transaction(
    tests.map((test, i) => {
      const result = results[i];
      const status = result
        ? caseVerdict(result, test.expectedStdout, test.compareMode)
        : "error";
      statuses.push(status);
      const stderr = result
        ? [result.compileOutput, result.stderr, result.message].filter(Boolean).join("\n")
        : "No executor result";
      return prisma.runCase.create({
        data: {
          runId: run.id,
          testCaseId: test.id,
          ordinal: test.ordinal,
          visibility: test.visibility,
          status,
          stdin: test.stdin,
          stdout: result?.stdout ?? null,
          stderr: stderr || null,
          expected: test.expectedStdout,
          time: result?.time ?? null,
          memory: result?.memory ?? null,
        },
      });
    }),
  );

  const updated = await prisma.run.update({
    where: { id: run.id },
    data: {
      status: "done",
      verdict: rollup(statuses),
    },
    include: { cases: true },
  });

  return runToDto(updated);
}
