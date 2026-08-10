import { z } from "zod";
import { normalizeTopicTags } from "@/lib/mistakes/categories";

export const AlternateApproachSchema = z.object({
  name: z.string(),
  idea: z.string(),
  time: z.string(),
  space: z.string(),
  whenToUse: z.string(),
});

export const MentorAnalysisSchema = z.object({
  socraticQuestions: z.array(z.string()).min(2).max(6),
  understoodApproach: z.string(),
  estimatedComplexity: z.object({
    time: z.string(),
    space: z.string(),
    rationale: z.string(),
  }),
  strengths: z.array(z.string()),
  missedObservations: z.array(z.string()),
  alternateApproaches: z.array(AlternateApproachSchema),
  compareVsOptimal: z.object({
    yourRank: z.enum(["optimal", "near", "suboptimal"]),
    gap: z.string(),
    whyFaster: z.string(),
  }),
  wrongDirection: z.string().optional().nullable(),
  relatedConcepts: z.array(z.string()),
  hintLevel1: z.string(),
  suggestedMistakeTags: z.array(z.string()),
});

export type MentorAnalysis = z.infer<typeof MentorAnalysisSchema>;
export type AlternateApproach = z.infer<typeof AlternateApproachSchema>;

/**
 * Normalize mentor topic tags. Drops syntax/noise. No fixed allowlist.
 * Cap at 8 tags.
 */
export function sanitizeSuggestedTags(tags: string[]): string[] {
  return normalizeTopicTags(tags).slice(0, 8);
}

export type SessionMessage = {
  role: "user" | "assistant";
  content: string;
  at: string;
};
