import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Resolve SQLite file path the same way for runtime as Prisma CLI (cwd-relative). */
export function resolveSqlitePath(databaseUrl = process.env.DATABASE_URL): string {
  const rawUrl = databaseUrl ?? "file:./prisma/dev.db";
  const relativePath = rawUrl.replace(/^file:/, "");
  return path.isAbsolute(relativePath)
    ? relativePath
    : path.resolve(process.cwd(), relativePath);
}

function createPrismaClient() {
  const dbPath = resolveSqlitePath();
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
