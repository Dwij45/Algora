import { MISTAKE_CATEGORIES } from "@/lib/mistakes/categories";
import { PROMPT_LIMITS } from "./limits";

export { PROMPT_LIMITS } from "./limits";

const TAG_LIST = MISTAKE_CATEGORIES.join(", ");

function clip(text: string, max: number): { text: string; truncated: boolean } {
  const trimmed = text.trim();
  if (trimmed.length <= max) return { text: trimmed, truncated: false };
  return {
    text: `${trimmed.slice(0, max)}\n\n[truncated for length]`,
    truncated: true,
  };
}

/**
 * System rules for the FIRST analysis turn.
 * Forces Socratic JSON — no full coded solutions on turn 1.
 */
export function mentorSystemPrompt(): string {
  return `You are a Socratic DSA mentor for ONE learner using a personal local learning coach.

Hard rules:
- Never run code, never claim judge runtime, never invent milliseconds.
- Do NOT paste a full coded solution or complete editorial algorithm dump.
- First response prioritizes understanding: ask probing questions before teaching.
- Estimate Big-O from the learner's described approach / code structure only.
- Propose alternate approaches with time/space and when each wins.
- Compare vs a typical optimal approach; explain WHY faster ideas win (data structures / algorithms), not fake timings.
- suggestedMistakeTags: use ONLY these exact strings when relevant: ${TAG_LIST}
- Return ONLY valid JSON matching the schema. No markdown fences, no commentary outside JSON.
- Keep every string field concise. Prefer short bullets over long essays so the JSON stays complete.

JSON schema shape:
{
  "socraticQuestions": string[2..6],
  "understoodApproach": string,
  "estimatedComplexity": { "time": string, "space": string, "rationale": string },
  "strengths": string[],
  "missedObservations": string[],
  "alternateApproaches": [{ "name", "idea", "time", "space", "whenToUse" }],
  "compareVsOptimal": { "yourRank": "optimal"|"near"|"suboptimal", "gap": string, "whyFaster": string },
  "wrongDirection": string|null,
  "relatedConcepts": string[],
  "hintLevel1": string,
  "suggestedMistakeTags": string[]
}`;
}

export function mentorAnalyzeUserPrompt(input: {
  title: string;
  slug: string;
  difficulty: string;
  contentText: string;
  userLogic: string;
  userCode?: string | null;
  selfComplexity?: string | null;
}): string {
  const statement = clip(input.contentText, PROMPT_LIMITS.problemStatement);
  const logic = clip(input.userLogic, PROMPT_LIMITS.userLogic);
  const code = input.userCode?.trim()
    ? clip(input.userCode, PROMPT_LIMITS.userCode)
    : null;
  const self = input.selfComplexity?.trim()
    ? `\nLearner self-estimated complexity: ${input.selfComplexity.trim().slice(0, 120)}`
    : "";

  const notes = [
    statement.truncated ? "problem statement truncated" : null,
    logic.truncated ? "learner logic truncated" : null,
    code?.truncated ? "learner code truncated" : null,
  ].filter(Boolean);

  const codeBlock = code
    ? `\n\nLearner code (not executed):\n\`\`\`\n${code.text}\n\`\`\``
    : "";

  return `Problem: ${input.title} (${input.slug}) — ${input.difficulty}
${notes.length ? `\nNote: ${notes.join("; ")}.` : ""}

Statement:
${statement.text}

Learner natural-language approach:
${logic.text}${self}${codeBlock}

Analyze as specified. Return JSON only.`;
}

/** Continue-turn system prompt — conversational guidance, still no full dump unless revealing. */
export function mentorContinueSystemPrompt(revealAlternates: boolean): string {
  if (revealAlternates) {
    return `You are a Socratic DSA mentor. The learner asked to reveal alternate approaches and compare vs optimal.

Rules:
- Expand alternates and compare/why-faster clearly in prose.
- You may outline algorithms at a high level; still avoid dumping a full copy-paste coded solution unless the learner already pasted code and asks you to refine it.
- Never invent judge runtimes.
- Keep the reply focused and educational (not a wall of spoilers).`;
  }

  return `You are a Socratic DSA mentor continuing a dialogue.

Rules:
- Ask or answer with deeper guidance; prefer questions and hints over full solutions.
- Do not paste a complete coded solution.
- Never invent judge runtimes.
- Keep replies concise and concrete.`;
}

export function mentorContinueUserPrompt(input: {
  title: string;
  slug: string;
  analysisSummary: string;
  userMessage: string;
  revealAlternates: boolean;
}): string {
  const intent = input.revealAlternates
    ? "The learner wants alternates / compare vs optimal expanded now."
    : "The learner sent a follow-up message.";
  const msg = clip(input.userMessage, PROMPT_LIMITS.continueMessage);

  return `Problem: ${input.title} (${input.slug})

Prior analysis summary (JSON excerpt):
${input.analysisSummary.slice(0, 6_000)}

${intent}

Learner message:
${msg.text || "(no text — reveal alternates only)"}

Reply as the mentor in plain text (not JSON).`;
}
