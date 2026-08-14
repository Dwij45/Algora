export type MistakeDto = {
  id: string;
  sessionId: string;
  category: string;
  note: string | null;
  tags: string[];
  createdAt: string;
  problemSlug: string;
  problemTitle: string | null;
};

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is string => typeof t === "string");
  } catch {
    return [];
  }
}

export function mistakeRowToDto(row: {
  id: string;
  sessionId: string;
  category: string;
  note: string | null;
  tagsJson: string;
  createdAt: Date;
  session?: {
    problemSlug: string;
    problem?: { title: string } | null;
  } | null;
}): MistakeDto {
  return {
    id: row.id,
    sessionId: row.sessionId,
    category: row.category,
    note: row.note,
    tags: parseTags(row.tagsJson),
    createdAt: row.createdAt.toISOString(),
    problemSlug: row.session?.problemSlug ?? "",
    problemTitle: row.session?.problem?.title ?? null,
  };
}
