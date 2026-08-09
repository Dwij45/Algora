import { PROBLEMSET_SEARCH, QUESTION_BY_SLUG } from "./queries";

const GRAPHQL_URL = "https://leetcode.com/graphql";
const MIN_GAP_MS = 300;

const globalRate = globalThis as unknown as {
  __leetcodeLastCallAt?: number;
};

async function waitForRateLimit() {
  const last = globalRate.__leetcodeLastCallAt ?? 0;
  const wait = MIN_GAP_MS - (Date.now() - last);
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  globalRate.__leetcodeLastCallAt = Date.now();
}

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Referer: "https://leetcode.com",
    Origin: "https://leetcode.com",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  };

  const session = process.env.LEETCODE_SESSION?.trim();
  const csrf = process.env.LEETCODE_CSRF?.trim();
  if (session || csrf) {
    const parts: string[] = [];
    if (session) parts.push(`LEETCODE_SESSION=${session}`);
    if (csrf) parts.push(`csrftoken=${csrf}`);
    headers.Cookie = parts.join("; ");
    if (csrf) headers["x-csrf-token"] = csrf;
  }

  return headers;
}

export class LeetCodeRequestError extends Error {
  status: number;
  body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "LeetCodeRequestError";
    this.status = status;
    this.body = body;
  }
}

async function graphql<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  await waitForRateLimit();

  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new LeetCodeRequestError(
      `LeetCode GraphQL HTTP ${res.status}`,
      res.status,
      text.slice(0, 500),
    );
  }

  let json: { data?: T; errors?: { message: string }[] };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new LeetCodeRequestError(
      "LeetCode returned non-JSON response",
      res.status,
      text.slice(0, 500),
    );
  }

  if (json.errors?.length) {
    throw new LeetCodeRequestError(
      json.errors.map((e) => e.message).join("; "),
      502,
      text.slice(0, 500),
    );
  }

  if (!json.data) {
    throw new LeetCodeRequestError(
      "LeetCode returned empty data",
      502,
      text.slice(0, 500),
    );
  }

  return json.data;
}

export type LeetCodeTopicTag = { name: string; slug: string };

export type LeetCodeQuestionRaw = {
  questionId: string;
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  content: string | null;
  difficulty: string;
  sampleTestCase?: string | null;
  exampleTestcases?: string | null;
  hints?: string[] | null;
  topicTags: LeetCodeTopicTag[];
  stats?: string | null;
  similarQuestions?: string | null;
  metaData?: string | null;
};

export type LeetCodeSearchItemRaw = {
  questionFrontendId?: string | null;
  frontendQuestionId?: string | null;
  title: string;
  titleSlug: string;
  difficulty: string;
  acRate?: number | null;
  topicTags: LeetCodeTopicTag[];
};

export async function fetchQuestionBySlug(
  titleSlug: string,
): Promise<LeetCodeQuestionRaw | null> {
  const data = await graphql<{ question: LeetCodeQuestionRaw | null }>(
    QUESTION_BY_SLUG,
    { titleSlug },
  );
  return data.question;
}

export async function searchQuestions(
  keyword: string,
  limit = 20,
): Promise<{ total: number; questions: LeetCodeSearchItemRaw[] }> {
  const data = await graphql<{
    problemsetQuestionList: {
      total: number;
      questions: LeetCodeSearchItemRaw[];
    } | null;
  }>(PROBLEMSET_SEARCH, {
    categorySlug: "",
    limit,
    skip: 0,
    filters: { searchKeywords: keyword },
  });

  const list = data.problemsetQuestionList;
  if (!list) {
    return { total: 0, questions: [] };
  }
  return { total: list.total, questions: list.questions ?? [] };
}
