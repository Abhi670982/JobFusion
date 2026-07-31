if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/jobfusion?schema=public";
}

import assert from "assert";
import { JobSourceCategory } from "@prisma/client";
import { classifySourceCategory, assertCategoryMatch } from "@/lib/source-category";
import { buildCacheKey } from "@/lib/redis-cache";
import { normalizeCrawlKey } from "@/lib/queue";

async function runTests() {
  console.log("------------------------------------------------------------");
  console.log("Running Acceptance Tests: Phase A Source Separation & Security");
  console.log("------------------------------------------------------------");

  // Rule 1: Job Portal sources MUST ALWAYS classify as JOB_PORTAL and NEVER as COMPANY_CAREER
  const portalSources = ["linkedin", "indeed", "internshala", "wellfound", "aggregator"];
  for (const source of portalSources) {
    const classified = classifySourceCategory(source);
    assert.strictEqual(classified.category, JobSourceCategory.JOB_PORTAL, `Failed: ${source} must be JOB_PORTAL`);
    assert.notStrictEqual(classified.category, JobSourceCategory.COMPANY_CAREER, `Failed: ${source} must NOT be COMPANY_CAREER`);
    assert.strictEqual(assertCategoryMatch(JobSourceCategory.JOB_PORTAL, source), true);
    assert.strictEqual(assertCategoryMatch(JobSourceCategory.COMPANY_CAREER, source), false);
  }
  console.log("✅ Rule 1 Passed: Portal sources strictly classified as JOB_PORTAL.");

  // Rule 2: Official ATS & Company sources MUST ALWAYS classify as COMPANY_CAREER and NEVER as JOB_PORTAL
  const companySources = [
    "greenhouse",
    "lever",
    "ashby",
    "smartrecruiters",
    "workday",
    "successfactors",
    "taleo",
    "icims",
    "oracle_recruiting",
    "careers"
  ];
  for (const source of companySources) {
    const classified = classifySourceCategory(source);
    assert.strictEqual(classified.category, JobSourceCategory.COMPANY_CAREER, `Failed: ${source} must be COMPANY_CAREER`);
    assert.notStrictEqual(classified.category, JobSourceCategory.JOB_PORTAL, `Failed: ${source} must NOT be JOB_PORTAL`);
    assert.strictEqual(assertCategoryMatch(JobSourceCategory.COMPANY_CAREER, source), true);
    assert.strictEqual(assertCategoryMatch(JobSourceCategory.JOB_PORTAL, source), false);
  }
  console.log("✅ Rule 2 Passed: Company ATS sources strictly classified as COMPANY_CAREER.");

  // Rule 3: Unknown or malformed sources MUST quarantine as UNKNOWN and NOT be guessed
  const unknownSources = ["some_random_scraper", "custom_feed_99", "", null, undefined];
  for (const source of unknownSources) {
    const classified = classifySourceCategory(source as any);
    assert.strictEqual(classified.category, JobSourceCategory.UNKNOWN, `Failed: ${source} must be UNKNOWN`);
    assert.strictEqual(classified.isVerified, false);
  }
  console.log("✅ Rule 3 Passed: Unknown sources quarantined as UNKNOWN without guessing.");

  // Rule 4: Cache keys for identical queries MUST remain strictly isolated between categories
  const query = "React";
  const location = "India";
  const page = 1;

  const companyCacheKey = buildCacheKey(JobSourceCategory.COMPANY_CAREER, query, location, page);
  const portalCacheKey = buildCacheKey(JobSourceCategory.JOB_PORTAL, query, location, page);

  assert.ok(companyCacheKey.includes("COMPANY_CAREER"), "Company cache key missing COMPANY_CAREER category tag");
  assert.ok(portalCacheKey.includes("JOB_PORTAL"), "Portal cache key missing JOB_PORTAL category tag");
  assert.notStrictEqual(companyCacheKey, portalCacheKey, "Company and Portal cache keys must not be identical");
  console.log("✅ Rule 4 Passed: Category-aware Redis cache key isolation verified.");

  // Rule 5: BullMQ deterministic job keys MUST be reproducible across multiple application instances
  const params1 = {
    category: JobSourceCategory.JOB_PORTAL,
    provider: "linkedin",
    keyword: "React Developer",
    location: "India",
  };

  const params2 = {
    category: JobSourceCategory.JOB_PORTAL,
    provider: "LINKEDIN ",
    keyword: "react developer ",
    location: " india",
  };

  const key1 = normalizeCrawlKey(params1);
  const key2 = normalizeCrawlKey(params2);

  assert.strictEqual(key1, "crawl-JOB_PORTAL-LINKEDIN-react_developer-india");
  assert.strictEqual(key1, key2, "Normalized job keys across instances must match");
  console.log("✅ Rule 5 Passed: BullMQ deterministic distributed identity verified.");

  console.log("------------------------------------------------------------");
  console.log("ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY! 🎉");
  console.log("------------------------------------------------------------");
}

runTests().catch((err) => {
  console.error("❌ Acceptance test failed:", err);
  process.exit(1);
});
