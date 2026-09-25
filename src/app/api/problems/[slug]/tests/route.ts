import { NextResponse } from "next/server";
import { JUDGE_CATALOG } from "@/lib/judge/catalog";
import { syncCatalogForSlug } from "@/lib/judge/sync";
import { prisma } from "@/lib/db";
import { normalizeProblemSlug } from "@/lib/utils/slug";
import { isRunnerConfigured, runnerReachable } from "@/lib/judge/executor-client";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug: raw } = await context.params;
  const slug = normalizeProblemSlug(decodeURIComponent(raw));
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  const spec = await syncCatalogForSlug(slug);
  const samples = await prisma.problemTestCase.findMany({
    where: { problemSlug: slug, visibility: "sample" },
    orderBy: { ordinal: "asc" },
  });

  const configured = isRunnerConfigured();

  return NextResponse.json({
    slug,
    configured,
    reachable: configured ? await runnerReachable() : false,
    curated: Boolean(spec),
    entryName: spec?.entryName ?? null,
    starters: spec?.starters ?? null,
    hiddenCount: spec ? spec.cases.filter((c) => c.visibility === "hidden").length : 0,
    tests: samples.map((row) => ({
      id: row.id,
      ordinal: row.ordinal,
      stdin: row.stdin,
      expectedStdout: row.expectedStdout,
      explanation: row.explanation,
      compareMode: row.compareMode,
    })),
    catalogSlugs: Object.keys(JUDGE_CATALOG),
  });
}
