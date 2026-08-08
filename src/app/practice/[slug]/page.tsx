import Link from "next/link";
import { PracticeWorkspace } from "@/components/practice/PracticeWorkspace";
import { getProblemBySlug } from "@/lib/leetcode/cache";
import { normalizeProblemSlug } from "@/lib/utils/slug";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session?: string }>;
};

export default async function PracticeProblemPage({
  params,
  searchParams,
}: PageProps) {
  const { slug: raw } = await params;
  const { session: sessionId } = await searchParams;
  const slug = normalizeProblemSlug(decodeURIComponent(raw));

  if (!slug) {
    return (
      <ErrorState
        title="Invalid problem"
        detail="That slug does not look like a LeetCode titleSlug."
      />
    );
  }

  const result = await getProblemBySlug(slug);

  if ("error" in result) {
    return (
      <ErrorState
        title="Could not load problem"
        detail={result.error}
        slug={slug}
      />
    );
  }

  return (
    <PracticeWorkspace
      problem={result.problem}
      initialSessionId={sessionId ?? null}
    />
  );
}

function ErrorState({
  title,
  detail,
  slug,
}: {
  title: string;
  detail: string;
  slug?: string;
}) {
  return (
    <div className="animate-fade-in mx-auto max-w-lg rounded-[var(--radius)] border border-danger/30 bg-danger/10 p-6">
      <h1 className="text-lg font-semibold text-danger">{title}</h1>
      <p className="mt-2 text-sm text-text/90">{detail}</p>
      {slug ? (
        <p className="mt-2 font-mono text-xs text-muted">slug: {slug}</p>
      ) : null}
      <Link
        href="/practice"
        className="mt-5 inline-flex text-sm text-accent hover:text-accent-dim"
      >
        ← Back to Practice
      </Link>
    </div>
  );
}
