export const RUNNABLE_LANGUAGES = ["python", "javascript", "java", "cpp"] as const;
export type RunnableLanguage = (typeof RUNNABLE_LANGUAGES)[number];

/** Names the execute API expects (`c++` not `cpp`). */
export const EXECUTOR_LANGUAGE: Record<RunnableLanguage, string> = {
  python: "python",
  javascript: "javascript",
  java: "java", // for Java runner
  cpp: "c++", // for C++: runner language id is "c++", UI uses "cpp"
};

export function isRunnableLanguage(value: string): value is RunnableLanguage {
  return (RUNNABLE_LANGUAGES as readonly string[]).includes(value);
}
// UI             Executor
// ------------------------
// python   →     python
// javascript →   javascript
// java     →     java
// cpp      →     c++