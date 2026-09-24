import { prisma } from "@/lib/db";
import { JUDGE_CATALOG } from "./catalog";

export async function syncCatalogForSlug(slug: string) {
  const spec = JUDGE_CATALOG[slug];
  if (!spec) return null;

  await prisma.problemJudgeConfig.upsert({
    where: { problemSlug: slug },
    create: { problemSlug: slug, entryName: spec.entryName, protocol: "json_args" },
    update: { entryName: spec.entryName, protocol: "json_args" },
  });

  for (const [index, test] of spec.cases.entries()) {
    const catalogKey = `${slug}:${test.visibility}:${index}`;
    await prisma.problemTestCase.upsert({
      where: { catalogKey },
      create: {
        catalogKey,
        problemSlug: slug,
        visibility: test.visibility,
        ordinal: index,
        stdin: test.stdin,
        expectedStdout: test.expectedStdout,
        explanation: test.explanation ?? null,
        compareMode: spec.compareMode,
      },
      update: {
        stdin: test.stdin,
        expectedStdout: test.expectedStdout,
        explanation: test.explanation ?? null,
        compareMode: spec.compareMode,
        ordinal: index,
        visibility: test.visibility,
      },
    });
  }

  return spec;
}
