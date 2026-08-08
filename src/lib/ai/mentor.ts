import { getLlmProvider } from "./provider";
import {
  mentorAnalyzeUserPrompt,
  mentorContinueSystemPrompt,
  mentorContinueUserPrompt,
  mentorSystemPrompt,
} from "./prompts";
import {
  MentorAnalysisSchema,
  sanitizeSuggestedTags,
  type MentorAnalysis,
  type SessionMessage,
} from "./schemas";

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export function parseMentorAnalysis(raw: string): MentorAnalysis {
  const cleaned = stripMarkdownFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Mentor returned invalid JSON. Try Analyze again.");
  }

  const result = MentorAnalysisSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Mentor JSON failed validation: ${result.error.issues
        .slice(0, 3)
        .map((i) => i.message)
        .join("; ")}`,
    );
  }

  return {
    ...result.data,
    suggestedMistakeTags: sanitizeSuggestedTags(
      result.data.suggestedMistakeTags,
    ),
  };
}

export async function analyzeApproach(input: {
  title: string;
  slug: string;
  difficulty: string;
  contentText: string;
  userLogic: string;
  userCode?: string | null;
  selfComplexity?: string | null;
}): Promise<MentorAnalysis> {
  const llm = getLlmProvider();
  const raw = await llm.complete(
    [
      { role: "system", content: mentorSystemPrompt() },
      { role: "user", content: mentorAnalyzeUserPrompt(input) },
    ],
    { json: true, temperature: 0.35, maxTokens: 8192 },
  );
  return parseMentorAnalysis(raw);
}

export async function continueMentorship(input: {
  title: string;
  slug: string;
  analysis: MentorAnalysis;
  history: SessionMessage[];
  userMessage: string;
  revealAlternates: boolean;
}): Promise<string> {
  const llm = getLlmProvider();
  const summary = JSON.stringify(
    {
      understoodApproach: input.analysis.understoodApproach,
      estimatedComplexity: input.analysis.estimatedComplexity,
      compareVsOptimal: input.analysis.compareVsOptimal,
      alternateApproaches: input.analysis.alternateApproaches,
      missedObservations: input.analysis.missedObservations,
      hintLevel1: input.analysis.hintLevel1,
    },
    null,
    2,
  );

  const bounded = input.history.slice(-12);
  const messages = [
    {
      role: "system" as const,
      content: mentorContinueSystemPrompt(input.revealAlternates),
    },
    ...bounded.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user" as const,
      content: mentorContinueUserPrompt({
        title: input.title,
        slug: input.slug,
        analysisSummary: summary,
        userMessage: input.userMessage,
        revealAlternates: input.revealAlternates,
      }),
    },
  ];

  return llm.complete(messages, {
    json: false,
    temperature: 0.45,
    maxTokens: 2048,
  });
}

export function analysisToOpeningMessage(analysis: MentorAnalysis): string {
  const qs = analysis.socraticQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n");
  return `I read your approach as: ${analysis.understoodApproach}\n\nLet's dig in:\n${qs}`;
}

export type { MentorAnalysis, SessionMessage };
export { getConfiguredProviderInfo, getLlmProvider } from "./provider";
