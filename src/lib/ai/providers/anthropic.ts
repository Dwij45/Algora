import type { ChatMessage, CompletionOptions, LlmProvider } from "../types";

/** Stub — install `@anthropic-ai/sdk` and implement when you switch AI_PROVIDER=anthropic. */
export function createAnthropicProvider(): LlmProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is missing. Set it in .env to use AI_PROVIDER=anthropic.",
    );
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";

  return {
    id: "anthropic",
    model,
    async complete(_messages: ChatMessage[], _options?: CompletionOptions) {
      throw new Error(
        "Anthropic provider is not wired yet. Keep AI_PROVIDER=gemini, or implement src/lib/ai/providers/anthropic.ts.",
      );
    },
  };
}
