-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "frontendId" TEXT,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "contentHtml" TEXT,
    "contentText" TEXT NOT NULL,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "statsJson" TEXT NOT NULL DEFAULT '{}',
    "acRate" REAL,
    "similarJson" TEXT NOT NULL DEFAULT '[]',
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "problemSlug" TEXT NOT NULL,
    "userLogic" TEXT NOT NULL,
    "userCode" TEXT,
    "selfComplexity" TEXT,
    "analysisJson" TEXT NOT NULL DEFAULT '{}',
    "messagesJson" TEXT NOT NULL DEFAULT '[]',
    "inputHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'analyzed',
    "revealAlternates" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_problemSlug_fkey" FOREIGN KEY ("problemSlug") REFERENCES "Problem" ("slug") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mistake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "note" TEXT,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mistake_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "evidenceJson" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Problem_slug_key" ON "Problem"("slug");

-- CreateIndex
CREATE INDEX "Session_problemSlug_idx" ON "Session"("problemSlug");

-- CreateIndex
CREATE INDEX "Session_createdAt_idx" ON "Session"("createdAt");

-- CreateIndex
CREATE INDEX "Mistake_category_idx" ON "Mistake"("category");

-- CreateIndex
CREATE INDEX "Mistake_createdAt_idx" ON "Mistake"("createdAt");

-- CreateIndex
CREATE INDEX "Insight_type_idx" ON "Insight"("type");
