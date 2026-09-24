import type { Run, RunCase } from "@/generated/prisma/client";

export type RunCaseDto = {
  id: string;
  ordinal: number;
  visibility: string;
  status: string;
  stdin: string | null;
  stdout: string | null;
  stderr: string | null;
  expected: string | null;
  time: string | null;
  memory: string | null;
};

export type RunDto = {
  id: string;
  problemSlug: string;
  language: string;
  mode: string;
  status: string;
  verdict: string | null;
  error: string | null;
  passed: number;
  total: number;
  createdAt: string;
  cases: RunCaseDto[];
};

export function runToDto(
  run: Run & { cases: RunCase[] },
  opts?: { hideHiddenDetails?: boolean },
): RunDto {
  const hide = opts?.hideHiddenDetails ?? run.mode === "submit";
  const cases = [...run.cases]
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((row) => {
      const hidden = hide && row.visibility === "hidden";
      return {
        id: row.id,
        ordinal: row.ordinal,
        visibility: row.visibility,
        status: row.status,
        stdin: hidden ? null : row.stdin,
        stdout: hidden ? clip(row.stdout, 400) : row.stdout,
        stderr: hidden ? clip(row.stderr, 400) : row.stderr,
        expected: hidden ? null : row.expected,
        time: row.time,
        memory: row.memory,
      };
    });

  const passed = cases.filter((c) => c.status === "passed").length;
  return {
    id: run.id,
    problemSlug: run.problemSlug,
    language: run.language,
    mode: run.mode,
    status: run.status,
    verdict: run.verdict,
    error: run.error,
    passed,
    total: cases.length,
    createdAt: run.createdAt.toISOString(),
    cases,
  };
}

function clip(value: string | null, max: number): string | null {
  if (!value) return value;
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
