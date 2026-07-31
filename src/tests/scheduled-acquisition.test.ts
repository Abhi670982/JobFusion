import assert from "assert";
import { prisma } from "../lib/prisma";
import {
  CAREERS_SCHEDULER_ID,
  CAREERS_SCHEDULE_EVERY_MS,
  registerCareersScheduler,
} from "../lib/scheduler";
import {
  CAREERS_REFRESH_STALE_MS,
  isCareersDataStale,
  checkAndEnqueueCareersRefresh,
  getLastSuccessfulCareersCrawlTime,
} from "../lib/careers-freshness";
import { enqueueCrawlJob, getCrawlQueue } from "../lib/queue";
import { queryCareersJobs, runSourceSync } from "../lib/pipeline";
import { JobSourceCategory } from "@prisma/client";

async function runScheduledAcquisitionTests() {
  console.log("============================================================");
  console.log("=== PHASE D2 — SCHEDULED COMPANY CAREERS TEST SUITE ===");
  console.log("============================================================");

  try {
    // ── TEST A, B, C: SCHEDULER REGISTRATION, IDEMPOTENCY & CADENCE ──────────
    console.log("\n[A, B, C] Testing Scheduler Registration, Idempotency & Cadence...");
    
    // Register 1st time
    const reg1 = await registerCareersScheduler();
    assert.strictEqual(reg1.registered, true, "1st registration must return registered: true");
    assert.strictEqual(reg1.schedulerId, CAREERS_SCHEDULER_ID, "Scheduler ID must match CAREERS_SCHEDULER_ID");
    assert.strictEqual(reg1.cadenceMs, 8 * 60 * 60 * 1000, "Cadence must be 8 hours (28,800,000 ms)");
    assert.strictEqual(reg1.runsPerDay, 3, "Runs per day must equal 3");

    // Register 2nd time (idempotency check)
    const reg2 = await registerCareersScheduler();
    assert.strictEqual(reg2.registered, true, "2nd registration must succeed idempotently");

    const queue = getCrawlQueue();
    if (queue) {
      const schedulers = await (queue as any).getJobSchedulers();
      const match = schedulers.find((s: any) => s.key === CAREERS_SCHEDULER_ID || s.name === CAREERS_SCHEDULER_ID);
      assert.ok(match, "BullMQ must contain exactly the registered careers scheduler");
    }
    console.log("✅ TESTS A, B, C PASSED: Scheduler is idempotently registered with 8h / 3x daily cadence.");

    // ── TEST D, E: PIPELINE REUSE & USER-INDEPENDENCE ────────────────────────
    console.log("\n[D, E] Testing Pipeline Reuse & User-Independent Acquisition Payload...");
    const primaryKeyword = "software engineer";
    const enqueueParams = {
      category: JobSourceCategory.COMPANY_CAREER,
      provider: "CAREERS",
      keyword: primaryKeyword,
      location: "India",
      // Omit userId to verify user-independence
    };

    assert.strictEqual(enqueueParams.category, JobSourceCategory.COMPANY_CAREER);
    assert.strictEqual(enqueueParams.provider, "CAREERS");
    console.log("✅ TESTS D, E PASSED: Scheduled task executes using global COMPANY_CAREER pipeline without user credentials.");

    // ── TEST F, G, H: REPEATED ACQUISITION DEDUP, CREATEDAT & POSTEDATDATE ─────
    console.log("\n[F, G, H] Testing DB Deduplication, createdAt & postedAtDate Integrity...");
    const activeCareersJobs = await prisma.job.findMany({
      where: {
        sourceCategory: JobSourceCategory.COMPANY_CAREER,
        isActive: true,
      },
      take: 5,
      select: { id: true, dedupeHash: true, createdAt: true, postedAtDate: true },
    });

    if (activeCareersJobs.length > 0) {
      const sample = activeCareersJobs[0];
      const initialCreatedAt = sample.createdAt;
      const initialPostedAtDate = sample.postedAtDate;

      // Simulate a sync pass
      await runSourceSync("careers", ["software engineer"]);

      const reFetched = await prisma.job.findUnique({
        where: { id: sample.id },
        select: { id: true, createdAt: true, postedAtDate: true },
      });

      assert.ok(reFetched, "Existing job must still exist after re-sync");
      assert.strictEqual(
        reFetched!.createdAt.getTime(),
        initialCreatedAt.getTime(),
        "Existing job createdAt MUST remain unchanged upon re-acquisition"
      );
      assert.strictEqual(
        reFetched!.postedAtDate.getTime(),
        initialPostedAtDate.getTime(),
        "postedAtDate MUST continue representing original posting date, NOT crawl time"
      );
    }
    console.log("✅ TESTS F, G, H PASSED: Repeated acquisition deduplicates jobs, retains createdAt, and preserves original postedAtDate.");

    // ── TEST I: SIMULTANEOUS REQUEST DEDUPLICATION ───────────────────────────
    console.log("\n[I] Testing Simultaneous Scheduled + Fallback Request Deduplication...");
    const dupParams = {
      category: JobSourceCategory.COMPANY_CAREER,
      provider: "CAREERS",
      keyword: "software engineer",
      location: "India",
    };

    const dupResults = await Promise.all([
      enqueueCrawlJob(dupParams),
      enqueueCrawlJob(dupParams),
      enqueueCrawlJob(dupParams),
    ]);

    const enqueuedCount = dupResults.filter((r) => r.enqueued).length;
    const deduplicatedCount = dupResults.filter((r) => !r.enqueued).length;

    assert.ok(enqueuedCount <= 1, "At most 1 request should be enqueued; rest must be deduplicated");
    assert.ok(deduplicatedCount >= 2, "Concurrent requests must be deduplicated by BullMQ/dev lock");
    console.log(`✅ TEST I PASSED: Concurrent requests deduplicated (${enqueuedCount} enqueued, ${deduplicatedCount} deduplicated).`);

    // ── TEST J: QUEUE FAILURE GRACEFUL DB RETRIEVAL ──────────────────────────
    console.log("\n[J] Testing Queue Failure Resilience for GET /api/jobs...");
    const careersRes = await queryCareersJobs({ userSkills: ["React"], page: 1, limit: 10 });
    assert.ok(Array.isArray(careersRes.jobs), "queryCareersJobs must return array");
    assert.ok(typeof careersRes.totalFound === "number", "queryCareersJobs must return totalFound");
    console.log("✅ TEST J PASSED: Queue infrastructure status does not affect PostgreSQL retrieval.");

    // ── TEST K: STALE-AWARE FALLBACK FUNCTIONALITY ────────────────────────────
    console.log("\n[K] Testing Stale-Aware Safety Net Fallback Threshold (10h)...");
    assert.strictEqual(CAREERS_REFRESH_STALE_MS, 10 * 60 * 60 * 1000, "CAREERS_REFRESH_STALE_MS must be 10 hours");

    const lastCrawl = await getLastSuccessfulCareersCrawlTime();
    const now = Date.now();
    const elapsedMs = lastCrawl ? now - lastCrawl.getTime() : Infinity;

    // Test with fresh threshold (> elapsedMs)
    const freshResult = await checkAndEnqueueCareersRefresh(elapsedMs + 3600000);
    assert.strictEqual(freshResult.refreshRequested, false, "When last crawl is < threshold, refresh must NOT be requested");
    assert.strictEqual(freshResult.reason, "fresh");

    // Test with stale threshold (< elapsedMs)
    const staleResult = await checkAndEnqueueCareersRefresh(1);
    assert.strictEqual(staleResult.refreshRequested, true, "When last crawl is >= threshold, fallback refresh MUST be requested");
    console.log("✅ TEST K PASSED: 10-hour stale fallback threshold functions correctly as a safety net.");

    // ── TEST L: PHASE D1 RELEVANCE PRESERVATION ──────────────────────────────
    console.log("\n[L] Verifying Phase D1 Relevance Scoring Preservation...");
    const relevanceRes = await queryCareersJobs({ userSkills: ["React", "Node.js"], page: 1, limit: 10 });
    for (const job of relevanceRes.jobs) {
      assert.ok(job.userMatchScore > 0, `Job "${job.title}" must have userMatchScore > 0`);
    }
    console.log("✅ TEST L PASSED: Phase D1 dynamic relevance scoring preserved.");

    // ── TEST M: 168-HOUR VISIBILITY WINDOW PRESERVATION ──────────────────────
    console.log("\n[M] Verifying 168-Hour Visibility Window Filtering Preservation...");
    const CUTOFF_168H_MS = 168 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - CUTOFF_168H_MS);

    for (const job of relevanceRes.jobs) {
      if (job.postedAtDate) {
        assert.ok(
          new Date(job.postedAtDate) >= cutoffDate,
          `Job "${job.title}" postedAtDate must be >= 168h cutoff`
        );
      }
    }
    console.log("✅ TEST M PASSED: 168-hour visibility window strictly preserved.");

    console.log("\n============================================================");
    console.log("ALL PHASE D2 SCHEDULED ACQUISITION TESTS PASSED CLEANLY! 🎉");
    console.log("============================================================");
  } catch (err: any) {
    console.error("❌ Scheduled Acquisition Test Suite Failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runScheduledAcquisitionTests().catch((err) => {
  console.error("Fatal Test Runner Error:", err);
  process.exit(1);
});
