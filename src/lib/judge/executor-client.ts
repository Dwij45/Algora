import { JUDGE_LIMITS } from "./limits";
import { EXECUTOR_LANGUAGE, type RunnableLanguage } from "./languages";

/** Local algora-runner (or any compatible execute API). Set EXECUTOR_DISABLED=1 to skip Run/Submit. */
export function isRunnerConfigured(): boolean {
  if (process.env.EXECUTOR_DISABLED === "1") return false;
  return true;
}
export async function runnerReachable(): Promise<boolean> {
  const health = `${baseUrl().replace(/\/api\/v2$/, "")}/health`;
  try {
    const res = await fetch(health, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

function headers(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const key = process.env.EXECUTOR_TOKEN?.trim();
  if (key) h.Authorization = key;
  return h;
}

function baseUrl(): string {
  return (
    process.env.EXECUTOR_URL?.trim() || "http://127.0.0.1:2000/api/v2"
  ).replace(/\/$/, "");
}

export type ExecutorResult = {
  token: string;
  statusId: number;
  statusName: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  time: string | null;
  memory: string | null;
};

type BatchItem = {
  language: RunnableLanguage;
  source: string;
  stdin: string;
};

function fileFor(language: RunnableLanguage, source: string): { name: string; content: string } {
  if (language === "java") return { name: "Main.java", content: source }; // for Java runner
  if (language === "cpp") return { name: "main.cpp", content: source }; // for C++
  if (language === "javascript") return { name: "index.js", content: source };
  return { name: "main.py", content: source };
}

export async function submitBatch(items: BatchItem[]): Promise<ExecutorResult[]> {
  if (!isRunnerConfigured()) {
    throw new Error("Executor is disabled (EXECUTOR_DISABLED=1).");
  }
  const out: ExecutorResult[] = [];
  const gapMs = Number(process.env.EXECUTOR_GAP_MS ?? 250);
  for (let i = 0; i < items.length; i++) {
    if (i > 0 && gapMs > 0) await sleep(gapMs);
    out.push(await executeOne(items[i], i));
  }
  return out;
}

async function executeOne(item: BatchItem, index: number): Promise<ExecutorResult> {
  const res = await fetch(`${baseUrl()}/execute`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      language: EXECUTOR_LANGUAGE[item.language],
      version: process.env.EXECUTOR_VERSION?.trim() || "*",
      files: [fileFor(item.language, item.source)],
      stdin: item.stdin,
      compile_timeout: 10_000,
      // for Java runner: cold JVM in Docker often exceeds 3s; other langs keep cpuTimeLimitSec
      run_timeout: item.language === "java" ? 10_000 : JUDGE_LIMITS.cpuTimeLimitSec * 1000,
    }),
  });

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const rec = asRecord(json);
    const msg =
      stringish(rec?.message) || JSON.stringify(json)?.slice(0, 240) || res.statusText;
    throw new Error(`Executor error (${res.status}): ${msg}`);
  }

  return mapExecutorResponse(asRecord(json), `run-${index}`);
}

function mapExecutorResponse(row: Record<string, unknown> | null, token: string): ExecutorResult {
  const compile = asRecord(row?.compile);
  const run = asRecord(row?.run);
  const compileOut = stringish(compile?.stderr) || stringish(compile?.output);
  const compileCode = compile ? Number(compile.code ?? 0) : 0;
  const runStdout = stringish(run?.stdout);
  const runStderr = stringish(run?.stderr);
  const runCode = run == null ? 1 : Number(run.code ?? 1);
  const signal = stringish(run?.signal);

  if (compile && compileCode !== 0) {
    return {
      token,
      statusId: 6,
      statusName: "Compilation Error",
      stdout: "",
      stderr: runStderr,
      compileOutput: compileOut,
      message: compileOut,
      time: null,
      memory: null,
    };
  }

  if (signal === "SIGKILL" || signal === "SIGXCPU") {
    return {
      token,
      statusId: 5,
      statusName: "Time Limit Exceeded",
      stdout: runStdout,
      stderr: runStderr,
      compileOutput: compileOut,
      message: signal,
      time: null,
      memory: null,
    };
  }

  if (runCode !== 0) {
    return {
      token,
      statusId: 7,
      statusName: "Runtime Error",
      stdout: runStdout,
      stderr: runStderr,
      compileOutput: compileOut,
      message: runStderr || `exit ${runCode}`,
      time: null,
      memory: null,
    };
  }

  return {
    token,
    statusId: 3,
    statusName: "Accepted",
    stdout: runStdout,
    stderr: runStderr,
    compileOutput: compileOut,
    message: "",
    time: null,
    memory: null,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null) return value as Record<string, unknown>;
  return null;
}

function stringish(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
