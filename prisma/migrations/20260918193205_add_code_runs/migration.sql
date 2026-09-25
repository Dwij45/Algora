-- CreateTable
CREATE TABLE "ProblemTestCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "problemSlug" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'sample',
    "ordinal" INTEGER NOT NULL,
    "stdin" TEXT NOT NULL,
    "expectedStdout" TEXT NOT NULL,
    "explanation" TEXT,
    "compareMode" TEXT NOT NULL DEFAULT 'json',
    "catalogKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProblemJudgeConfig" (
    "problemSlug" TEXT NOT NULL PRIMARY KEY,
    "entryName" TEXT NOT NULL,
    "protocol" TEXT NOT NULL DEFAULT 'json_args',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "problemSlug" TEXT NOT NULL,
    "sessionId" TEXT,
    "language" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "verdict" TEXT,
    "error" TEXT,
    "inputHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RunCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "testCaseId" TEXT,
    "ordinal" INTEGER NOT NULL,
    "visibility" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stdin" TEXT,
    "stdout" TEXT,
    "stderr" TEXT,
    "expected" TEXT,
    "time" TEXT,
    "memory" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RunCase_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RunCase_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "ProblemTestCase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UsageBudget" (
    "dayKey" TEXT NOT NULL PRIMARY KEY,
    "judgeCalls" INTEGER NOT NULL DEFAULT 0,
    "submitCount" INTEGER NOT NULL DEFAULT 0,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProblemTestCase_catalogKey_key" ON "ProblemTestCase"("catalogKey");

-- CreateIndex
CREATE INDEX "ProblemTestCase_problemSlug_visibility_ordinal_idx" ON "ProblemTestCase"("problemSlug", "visibility", "ordinal");

-- CreateIndex
CREATE INDEX "Run_problemSlug_createdAt_idx" ON "Run"("problemSlug", "createdAt");

-- CreateIndex
CREATE INDEX "Run_inputHash_idx" ON "Run"("inputHash");

-- CreateIndex
CREATE INDEX "RunCase_runId_idx" ON "RunCase"("runId");
