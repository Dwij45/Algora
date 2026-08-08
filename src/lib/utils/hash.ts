import { createHash } from "node:crypto";

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function sessionInputHash(parts: {
  problemSlug: string;
  userLogic: string;
  userCode?: string | null;
}): string {
  return sha256Hex(
    `${parts.problemSlug}\n${parts.userLogic}\n${parts.userCode ?? ""}`,
  );
}
