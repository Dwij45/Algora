import { NextResponse } from "next/server";
import { getProblemBySlug } from "@/lib/leetcode/cache";
import { normalizeProblemSlug } from "@/lib/utils/slug";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug: raw } = await context.params;
  const slug = normalizeProblemSlug(decodeURIComponent(raw));

  if (!slug) {
    return NextResponse.json(
      { error: "Invalid problem slug." },
      { status: 400 },
    );
  }

  const result = await getProblemBySlug(slug);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result);
}
