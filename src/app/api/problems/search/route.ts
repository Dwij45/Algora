import { NextResponse } from "next/server";
import { searchProblems } from "@/lib/leetcode/cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limitRaw = searchParams.get("limit");
  const limit = Math.min(
    Math.max(Number(limitRaw) || 20, 1),
    50,
  );

  const result = await searchProblems(q, limit);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result);
}
