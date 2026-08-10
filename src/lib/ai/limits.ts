/** free-tier-friendly bounds so Gemini doesn't fail/truncate. */
export const PROMPT_LIMITS = {
  problemStatement: 8_000,
  userLogic: 8_000,
  userCode: 10_000,
  continueMessage: 4_000,
  /** Raw base64 length ~1.2MB PNG after compression */
  boardImageBase64: 1_600_000,
} as const;