export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CompletionOptions = {
  /** Prefer JSON-only responses when the provider supports it. */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
};

/** Shared LLM surface — swap providers via AI_PROVIDER without changing call sites. */
export interface LlmProvider {
  readonly id: "gemini" | "openai" | "anthropic";
  readonly model: string;
  complete(messages: ChatMessage[], options?: CompletionOptions): Promise<string>;
}

export type AiProviderId = LlmProvider["id"];
