export type ImagePart = {
  mimeType: string;
  /** Raw base64 without data: URL prefix */
  data: string;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  /** Optional images (used on the final user turn for multimodal). */
  images?: ImagePart[];
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
