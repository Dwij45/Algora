import type { MentorAnalysis, SessionMessage } from "@/lib/ai/schemas";

export type SessionDto = {
  id: string;
  problemSlug: string;
  userLogic: string;
  userCode: string | null;
  selfComplexity: string | null;
  analysis: MentorAnalysis | Record<string, unknown>;
  messages: SessionMessage[];
  inputHash: string | null;
  status: string;
  revealAlternates: boolean;
  createdAt: string;
  updatedAt: string;
  problemTitle?: string | null;
};

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function sessionRowToDto(
  row: {
    id: string;
    problemSlug: string;
    userLogic: string;
    userCode: string | null;
    selfComplexity: string | null;
    analysisJson: string;
    messagesJson: string;
    inputHash: string | null;
    status: string;
    revealAlternates: boolean;
    createdAt: Date;
    updatedAt: Date;
    problem?: { title: string } | null;
  },
): SessionDto {
  return {
    id: row.id,
    problemSlug: row.problemSlug,
    userLogic: row.userLogic,
    userCode: row.userCode,
    selfComplexity: row.selfComplexity,
    analysis: parseJson(row.analysisJson, {}),
    messages: parseJson<SessionMessage[]>(row.messagesJson, []),
    inputHash: row.inputHash,
    status: row.status,
    revealAlternates: row.revealAlternates,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    problemTitle: row.problem?.title ?? null,
  };
}
