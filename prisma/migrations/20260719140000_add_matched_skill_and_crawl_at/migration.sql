-- AlterTable
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "matchedSkill" TEXT;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "lastCrawlAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "jobs_postedAtDate_isActive_source_idx" ON "jobs"("postedAtDate" DESC, "isActive", "source");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "jobs_matchedSkill_postedAtDate_idx" ON "jobs"("matchedSkill", "postedAtDate" DESC);