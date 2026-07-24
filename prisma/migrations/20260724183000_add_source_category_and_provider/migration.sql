-- CreateEnum
CREATE TYPE "JobSourceCategory" AS ENUM ('COMPANY_CAREER', 'JOB_PORTAL', 'UNKNOWN');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "sourceCategory" "JobSourceCategory",
ADD COLUMN     "sourceProvider" TEXT;

-- CreateIndex
CREATE INDEX "jobs_sourceCategory_idx" ON "jobs"("sourceCategory");

-- CreateIndex
CREATE INDEX "jobs_sourceCategory_postedAtDate_idx" ON "jobs"("sourceCategory", "postedAtDate" DESC);

-- CreateIndex
CREATE INDEX "jobs_sourceCategory_isActive_idx" ON "jobs"("sourceCategory", "isActive");

-- Safe Backfill of Existing Records
UPDATE "jobs"
SET "sourceCategory" = 'JOB_PORTAL'::"JobSourceCategory",
    "sourceProvider" = UPPER("source")
WHERE LOWER("source") IN ('linkedin', 'indeed', 'internshala', 'wellfound', 'aggregator');

UPDATE "jobs"
SET "sourceCategory" = 'COMPANY_CAREER'::"JobSourceCategory",
    "sourceProvider" = UPPER("source")
WHERE LOWER("source") IN ('careers', 'greenhouse', 'lever', 'ashby', 'smartrecruiters', 'workday');

UPDATE "jobs"
SET "sourceCategory" = 'UNKNOWN'::"JobSourceCategory",
    "sourceProvider" = COALESCE(UPPER("source"), 'UNKNOWN')
WHERE "sourceCategory" IS NULL;
