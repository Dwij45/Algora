import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ChatMessage, CompletionOptions, LlmProvider } from "./types";

const DEFAULT_MODEL = "gemini-2.0-flash";

function toGeminiRole(role: ChatMessage["role"]): "user" | "model" {
  return role === "assistant" ? "model" : "user";
}

export function createGeminiProvider(): LlmProvider {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Get a free key at https://aistudio.google.com/apikey",
    );
  }

  const modelName = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const client = new GoogleGenerativeAI(apiKey);

  return {
    id: "gemini",
    model: modelName,
    async complete(messages, options = {}) {
      const systemParts = messages
        .filter((m) => m.role === "system")
        .map((m) => m.content);
      const rest = messages.filter((m) => m.role !== "system");

      if (rest.length === 0) {
        throw new Error("Gemini complete() requires at least one user/assistant message");
      }

      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction:
          systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
        generationConfig: {
          temperature: options.temperature ?? 0.4,
          maxOutputTokens: options.maxTokens ?? 4096,
          responseMimeType: options.json ? "application/json" : undefined,
        },
      });

      // Gemini chat expects alternating user/model; fold consecutive same-role turns.
      const history: { role: "user" | "model"; parts: { text: string }[] }[] = [];
      for (const msg of rest.slice(0, -1)) {
        const role = toGeminiRole(msg.role);
        const last = history[history.length - 1];
        if (last && last.role === role) {
          last.parts[0].text += `\n\n${msg.content}`;
        } else {
          history.push({ role, parts: [{ text: msg.content }] });
        }
      }

      // Gemini requires history to start with user if non-empty.
      while (history.length > 0 && history[0].role !== "user") {
        history.shift();
      }

      const last = rest[rest.length - 1];
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(last.content);
      const text = result.response.text();
      if (!text?.trim()) {
        throw new Error("Gemini returned an empty response");
      }
      return text;
    },
  };
}
