/** free-tier-friendly bounds so Gemini doesn't fail/truncate. */
export const PROMPT_LIMITS = {
  problemStatement: 8_000,
  userLogic: 8_000,
  userCode: 10_000,
  continueMessage: 4_000,
} as const;
