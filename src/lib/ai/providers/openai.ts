import type { ChatMessage, CompletionOptions, LlmProvider } from "../types";

/** Stub — install `openai` and implement when you switch AI_PROVIDER=openai. */
export function createOpenAiProvider(): LlmProvider {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Set it in .env to use AI_PROVIDER=openai.");
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  return {
    id: "openai",
    model,
    async complete(_messages: ChatMessage[], _options?: CompletionOptions) {
      throw new Error(
        "OpenAI provider is not wired yet. Keep AI_PROVIDER=gemini, or implement src/lib/ai/providers/openai.ts.",
      );
    },
  };
}
