/** Compare judge stdout to expected. json_any_order = "indices in any order". */
export function outputsMatch(
  expected: string,
  actual: string,
  compareMode: string,
): boolean {
  const exp = expected.trim();
  const act = actual.trim();
  if (compareMode === "exact") return exp === act;

  try {
    const e = JSON.parse(exp) as unknown;
    const a = JSON.parse(act) as unknown;
    if (compareMode === "json_any_order") {
      return canonicalize(sortIfArray(e)) === canonicalize(sortIfArray(a));
    }
    return canonicalize(e) === canonicalize(a);
  } catch {
    return exp === act;
  }
}

function sortIfArray(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  if (value.every((x) => typeof x === "number")) {
    return [...value].sort((a, b) => a - b);
  }
  return [...value].sort((a, b) => canonicalize(a).localeCompare(canonicalize(b)));
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys
    .map(
      (k) =>
        `${JSON.stringify(k)}:${canonicalize((value as Record<string, unknown>)[k])}`,
    )
    .join(",")}}`;
}
