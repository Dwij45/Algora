import { createAnthropicProvider } from "./providers/anthropic";
import { createGeminiProvider } from "./providers/gemini";
import { createOpenAiProvider } from "./providers/openai";
import type { AiProviderId, LlmProvider } from "./types";

export type { AiProviderId, ChatMessage, CompletionOptions, LlmProvider } from "./types";

function resolveProviderId(): AiProviderId {
  const raw = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();
  if (raw === "openai" || raw === "anthropic" || raw === "gemini") {
    return raw;
  }
  throw new Error(
    `Unknown AI_PROVIDER="${raw}". Use gemini, openai, or anthropic.`,
  );
}

/** Factory — change AI_PROVIDER in .env to swap backends without touching mentor code. */
export function getLlmProvider(): LlmProvider {
  const id = resolveProviderId();
  switch (id) {
    case "gemini":
      return createGeminiProvider();
    case "openai":
      return createOpenAiProvider();
    case "anthropic":
      return createAnthropicProvider();
  }
}

export function getConfiguredProviderInfo(): {
  provider: AiProviderId;
  configured: boolean;
  modelHint: string;
} {
  const provider = (() => {
    try {
      return resolveProviderId();
    } catch {
      return "gemini" as AiProviderId;
    }
  })();

  const configured =
    provider === "gemini"
      ? Boolean(process.env.GEMINI_API_KEY?.trim())
      : provider === "openai"
        ? Boolean(process.env.OPENAI_API_KEY?.trim())
        : Boolean(process.env.ANTHROPIC_API_KEY?.trim());

  const modelHint =
    provider === "gemini"
      ? process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest"
      : provider === "openai"
        ? process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini"
        : process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514";

  return { provider, configured, modelHint };
}
