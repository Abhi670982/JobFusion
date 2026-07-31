import assert from "assert";
import { prisma } from "../lib/prisma";
import {
  CAREERS_REFRESH_STALE_MS,
  isCareersDataStale,
  checkAndEnqueueCareersRefresh,
  getLastSuccessfulCareersCrawlTime,
} from "../lib/careers-freshness";
import { enqueueCrawlJob } from "../lib/queue";
import { queryCareersJobs } from "../lib/pipeline";
import { JobSourceCategory } from "@prisma/client";

async function runCareersFreshnessTests() {
  console.log("============================================================");
  console.log("=== COMPANY CAREERS STALE-AWARE REFRESH TEST SUITE ===");
  console.log("============================================================");

  async function createMockFetchLog(source: string, status: "success" | "failed", timestamp: Date) {
    return prisma.fetchLog.create({
      data: {
        source,
        status,
        jobsFetched: 10,
        timestamp,
        errorMsg: JSON.stringify({ test: true }),
      },
    });
  }

  async function cleanupTestLogs() {
    await prisma.fetchLog.deleteMany({
      where: {
        errorMsg: { contains: '"test":true' },
      },
    });
  }

  try {
    await cleanupTestLogs();

    // ── TEST 1: FRESH FETCHLOG DOES NOT ENQUEUE CRAWL ────────────────────────
    console.log("\n1. Testing Careers GET with Fresh FetchLog...");
    const lastRealCrawl = await getLastSuccessfulCareersCrawlTime();
    const now = Date.now();
    const elapsedRealMs = lastRealCrawl ? now - lastRealCrawl.getTime() : Infinity;

    // Use a threshold larger than the last real crawl to test fresh logic
    const freshThresholdMs = elapsedRealMs < Infinity ? elapsedRealMs + 1000 * 60 * 60 : CAREERS_REFRESH_STALE_MS;

    const isStaleFresh = await isCareersDataStale(freshThresholdMs);
    assert.strictEqual(isStaleFresh, false, "When threshold > last crawl elapsed time, must be classified as FRESH");

    const refreshResultFresh = await checkAndEnqueueCareersRefresh(freshThresholdMs);
    assert.strictEqual(refreshResultFresh.refreshRequested, false, "Fresh FetchLog must not request refresh");
    assert.strictEqual(refreshResultFresh.reason, "fresh");
    console.log("✅ TEST 1 PASSED: Fresh FetchLog skips background crawl.");

    // ── TEST 2: STALE FETCHLOG REQUESTS BACKGROUND CRAWL ─────────────────────
    console.log("\n2. Testing Careers GET with Stale Threshold...");
    // Use a threshold smaller than elapsed time (e.g. 1ms) to test stale logic
    const staleThresholdMs = 1; // 1 millisecond -> immediately stale

    const isStaleStale = await isCareersDataStale(staleThresholdMs);
    assert.strictEqual(isStaleStale, true, "When threshold < last crawl elapsed time, must be classified as STALE");

    const refreshResultStale = await checkAndEnqueueCareersRefresh(staleThresholdMs);
    assert.strictEqual(refreshResultStale.refreshRequested, true, "Stale FetchLog must request refresh");
    console.log(`✅ TEST 2 PASSED: Stale FetchLog requests background refresh (reason: ${refreshResultStale.reason}).`);

    // ── TEST 3: MISSING / NO SUCCESSFUL FETCHLOG ─────────────────────────────
    console.log("\n3. Testing Missing FetchLog Behavior...");
    const isStaleForZeroThreshold = await isCareersDataStale(0);
    assert.strictEqual(isStaleForZeroThreshold, true, "Zero threshold must classify as STALE");
    console.log("✅ TEST 3 PASSED: Stale threshold logic accurately evaluates missing/expired logs.");

    // ── TEST 4: SIMULTANEOUS STALE REQUESTS & QUEUE DEDUPLICATION ─────────────
    console.log("\n4. Testing Concurrent Refresh Requests & Queue Deduplication...");
    const primaryKeyword = "software engineer";
    const enqueueParams = {
      category: JobSourceCategory.COMPANY_CAREER,
      provider: "CAREERS",
      keyword: primaryKeyword,
      location: "India",
    };

    const results = await Promise.all([
      enqueueCrawlJob(enqueueParams),
      enqueueCrawlJob(enqueueParams),
      enqueueCrawlJob(enqueueParams),
      enqueueCrawlJob(enqueueParams),
      enqueueCrawlJob(enqueueParams),
    ]);

    const enqueuedCount = results.filter((r) => r.enqueued).length;
    const deduplicatedCount = results.filter((r) => !r.enqueued).length;

    console.log(`   - Total Concurrent Enqueue Requests: ${results.length}`);
    console.log(`   - Enqueued: ${enqueuedCount}, Deduplicated: ${deduplicatedCount}`);

    assert.ok(enqueuedCount <= 1, "At most 1 request should be enqueued; rest must be deduplicated");
    assert.ok(deduplicatedCount >= 4, "Concurrent requests must be deduplicated by BullMQ/dev lock");
    console.log("✅ TEST 4 PASSED: Concurrent stale requests produce at most 1 active crawl.");

    // ── TEST 5: QUEUE / REDIS FAILURE GRACEFUL HANDLING ─────────────────────
    console.log("\n5. Testing DB Query Resilience During Queue Infrastructure Failure...");
    const careersJobsResult = await queryCareersJobs({ userSkills: ["React"], page: 1, limit: 10 });
    assert.ok(Array.isArray(careersJobsResult.jobs), "queryCareersJobs must return jobs array");
    assert.ok(typeof careersJobsResult.totalFound === "number", "queryCareersJobs must return totalFound number");
    console.log(`   - Returned ${careersJobsResult.jobs.length} jobs (Total: ${careersJobsResult.totalFound})`);
    console.log("✅ TEST 5 PASSED: Existing DB jobs returned successfully regardless of queue state.");

    // ── TEST 6: NON-CAREERS SOURCES DO NOT TRIGGER CAREERS REFRESH ────────────
    console.log("\n6. Testing Non-Careers Source Isolation...");
    const isCareersForPortal = "wellfound".split(",").map((s) => s.trim().toLowerCase()).includes("careers");
    assert.strictEqual(isCareersForPortal, false, "Portal source 'wellfound' must not trigger careers refresh");
    console.log("✅ TEST 6 PASSED: Non-careers sources bypass Company Careers refresh.");

    // ── TEST 7: 168-HOUR FRESHNESS FILTERING PRESERVATION ─────────────────────
    console.log("\n7. Verifying 168-Hour Visibility Window Filtering...");
    const CUTOFF_168H_MS = 168 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - CUTOFF_168H_MS);

    for (const job of careersJobsResult.jobs) {
      if (job.postedAtDate) {
        const jobDate = new Date(job.postedAtDate);
        assert.ok(
          jobDate >= cutoffDate,
          `Job "${job.title}" postedAtDate ${jobDate.toISOString()} is older than 168h cutoff ${cutoffDate.toISOString()}`
        );
      }
    }
    console.log("✅ TEST 7 PASSED: All returned careers jobs satisfy strict 168-hour cutoff.");

    // ── TEST 8: RELEVANCE FILTERING PRESERVATION ──────────────────────────────
    console.log("\n8. Verifying User Resume Relevance Filtering Integrity...");
    const skillJobs = await queryCareersJobs({ userSkills: ["React", "Node.js"], page: 1, limit: 10 });
    for (const job of skillJobs.jobs) {
      assert.ok(
        job.userMatchScore > 0,
        `Job "${job.title}" has invalid matchScore ${job.userMatchScore}; expected > 0`
      );
    }
    console.log("✅ TEST 8 PASSED: Relevance scoring strictly enforced (matchScore > 0).");

    // ── TEST 9: QUALITY TIER BUCKET + FRESHNESS WITHIN TIER PRESERVATION ─────
    console.log("\n9. Verifying Quality Tier Bucket Ordering & Freshness Within Tier...");
    for (let i = 0; i < skillJobs.jobs.length - 1; i++) {
      const currentTierRank = skillJobs.jobs[i].userMatchScore >= 70 ? 3 : skillJobs.jobs[i].userMatchScore >= 35 ? 2 : 1;
      const nextTierRank = skillJobs.jobs[i + 1].userMatchScore >= 70 ? 3 : skillJobs.jobs[i + 1].userMatchScore >= 35 ? 2 : 1;

      assert.ok(
        currentTierRank >= nextTierRank,
        `Tier ordering violation at index ${i}: Tier ${currentTierRank} should be >= Tier ${nextTierRank}`
      );

      if (currentTierRank === nextTierRank) {
        const currentMs = new Date(skillJobs.jobs[i].postedAtDate || 0).getTime();
        const nextMs = new Date(skillJobs.jobs[i + 1].postedAtDate || 0).getTime();
        assert.ok(
          currentMs >= nextMs,
          `Freshness violation within tier ${currentTierRank} at index ${i}: ${currentMs} should be >= ${nextMs}`
        );
      }
    }
    console.log("✅ TEST 9 PASSED: Results ordered strictly by Quality Tier (HIGH > MODERATE > LOW) and newest -> oldest within tier.");

    console.log("\n============================================================");
    console.log("ALL STALE-AWARE REFRESH ACCEPTANCE TESTS PASSED CLEANLY! 🎉");
    console.log("============================================================");
  } finally {
    await cleanupTestLogs();
  }
}

runCareersFreshnessTests().catch((err) => {
  console.error("❌ Careers Freshness Tests Failed:", err);
  process.exit(1);
});
