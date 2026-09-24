export const JUDGE_LIMITS = {
  sourceChars: 10_000,
  samplePerDay: 40,
  submitPerDay: 20,
  judgeCallsPerDay: 80,
  maxTestsPerRun: 20,
  cpuTimeLimitSec: 3,
  memoryLimitKb: 128000,
  pollMs: 450,
  maxWaitMs: 22_000,
  idempotencyWindowMs: 60_000,
} as const;
