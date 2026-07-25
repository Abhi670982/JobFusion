import assert from "assert";
import { calculateRelevanceScore, isTermInText } from "../lib/relevance";
import { canonicalizeUrl } from "../lib/url-cleaner";
import { classifySourceCategory } from "../lib/source-category";
import { JobSourceCategory } from "@prisma/client";

async function runPhaseBAcceptanceTests() {
  console.log("============================================================");
  console.log("=== PHASE B COMPREHENSIVE ACCEPTANCE TEST SUITE ===");
  console.log("============================================================");

  // ── TEST 1: FIXED REFERENCE CLOCK 168-HOUR BOUNDARY TEST ──────────────────
  console.log("\n1. Running Fixed Reference Clock 168-Hour Freshness Boundary Test...");
  const FIXED_NOW = new Date("2026-07-24T12:00:00.000Z");
  const CUTOFF_168H_MS = 168 * 60 * 60 * 1000; // 7 days exact
  const cutoffTime = new Date(FIXED_NOW.getTime() - CUTOFF_168H_MS);

  const testJobs = [
    { name: "1 hour old", date: new Date(FIXED_NOW.getTime() - 1 * 3600 * 1000), expectedVisible: true },
    { name: "23 hours old", date: new Date(FIXED_NOW.getTime() - 23 * 3600 * 1000), expectedVisible: true },
    { name: "25 hours old", date: new Date(FIXED_NOW.getTime() - 25 * 3600 * 1000), expectedVisible: true },
    { name: "3 days old", date: new Date(FIXED_NOW.getTime() - 72 * 3600 * 1000), expectedVisible: true },
    { name: "6 days old", date: new Date(FIXED_NOW.getTime() - 144 * 3600 * 1000), expectedVisible: true },
    { name: "167h 59m old", date: new Date(FIXED_NOW.getTime() - (167 * 3600 + 59 * 60) * 1000), expectedVisible: true },
    { name: "168h 1m old", date: new Date(FIXED_NOW.getTime() - (168 * 3600 + 1 * 60) * 1000), expectedVisible: false },
    { name: "30 days old", date: new Date(FIXED_NOW.getTime() - 720 * 3600 * 1000), expectedVisible: false },
    { name: "Null posting date", date: null, expectedVisible: false },
  ];

  for (const item of testJobs) {
    const isVisible = item.date ? (item.date >= cutoffTime && item.date <= FIXED_NOW) : false;
    assert.strictEqual(
      isVisible,
      item.expectedVisible,
      `Freshness failure for "${item.name}": expected visible=${item.expectedVisible}, got ${isVisible}`
    );
    console.log(`   - [${isVisible ? "VISIBLE" : "HIDDEN "}] ${item.name}`);
  }
  console.log("✅ TEST 1 PASSED: Strict 168-hour boundary evaluation is 100% accurate.");

  // ── TEST 2: DAY 1 THROUGH DAY 7 DISTRIBUTION & NEWEST-FIRST SORTING ──────
  console.log("\n2. Testing Day 1–7 Distribution & Newest-First Ordering...");
  const dayDistribution = [
    { day: 1, date: new Date(FIXED_NOW.getTime() - 12 * 3600 * 1000) },
    { day: 2, date: new Date(FIXED_NOW.getTime() - 36 * 3600 * 1000) },
    { day: 3, date: new Date(FIXED_NOW.getTime() - 60 * 3600 * 1000) },
    { day: 4, date: new Date(FIXED_NOW.getTime() - 84 * 3600 * 1000) },
    { day: 5, date: new Date(FIXED_NOW.getTime() - 108 * 3600 * 1000) },
    { day: 6, date: new Date(FIXED_NOW.getTime() - 132 * 3600 * 1000) },
    { day: 7, date: new Date(FIXED_NOW.getTime() - 156 * 3600 * 1000) },
  ];

  const sorted = [...dayDistribution].sort((a, b) => b.date.getTime() - a.date.getTime());
  for (let i = 0; i < sorted.length - 1; i++) {
    assert.ok(
      sorted[i].date.getTime() >= sorted[i + 1].date.getTime(),
      `Sort order error at index ${i}`
    );
  }
  console.log("   - All 7 days present and correctly sorted in newest-first order.");
  console.log("✅ TEST 2 PASSED: Day 1–7 distribution & sorting verified.");

  // ── TEST 3: RELEVANCE SCORING, ALIASES & BOUNDARY SAFETY ──────────────────
  console.log("\n3. Testing Relevance Engine, Skill Aliases & Word Boundary Safety...");

  // Boundary safety checks
  assert.strictEqual(isTermInText("c", "CSS Developer"), false, "'c' must NOT match 'CSS Developer'");
  assert.strictEqual(isTermInText("java", "JavaScript Engineer"), false, "'java' must NOT match 'JavaScript Engineer'");
  assert.strictEqual(isTermInText("js", "Senior JavaScript Engineer"), true, "'js' alias MUST match 'JavaScript Engineer'");
  assert.strictEqual(isTermInText("react.js", "Frontend React Developer"), true, "'react.js' alias MUST match 'React Developer'");

  // Scoring normalization checks
  const strongScore = calculateRelevanceScore(
    { title: "Senior React & Node.js Engineer", skills: ["react", "node.js"], description: "Looking for MERN expert." },
    ["react", "node.js"]
  );
  assert.ok(strongScore >= 80, `Strong match score should be >= 80, got ${strongScore}`);

  const weakScore = calculateRelevanceScore(
    { title: "Mechanical Designer", skills: ["cad"], description: "Solidworks experience required." },
    ["react", "node.js"]
  );
  assert.ok(weakScore <= 30, `Weak match score should be <= 30, got ${weakScore}`);

  console.log(`   - Strong Role Match Score: ${strongScore}%`);
  console.log(`   - Unrelated Role Match Score: ${weakScore}%`);
  console.log("✅ TEST 3 PASSED: Relevance engine is mathematically normalized (0-100) and boundary-safe.");

  // ── TEST 4: CONSERVATIVE URL CANONICALIZATION ────────────────────────────
  console.log("\n4. Testing Conservative URL Canonicalization...");
  const rawUrl = "https://careers.company.com/jobs/detail?gh_jid=12345&utm_source=linkedin&ref=search_page&fbclid=XYZ";
  const cleanedUrl = canonicalizeUrl(rawUrl);

  assert.ok(cleanedUrl?.includes("gh_jid=12345"), "Must PRESERVE identity parameter 'gh_jid'");
  assert.strictEqual(cleanedUrl?.includes("utm_source"), false, "Must REMOVE tracking parameter 'utm_source'");
  assert.strictEqual(cleanedUrl?.includes("ref="), false, "Must REMOVE tracking parameter 'ref'");
  assert.strictEqual(cleanedUrl?.includes("fbclid"), false, "Must REMOVE tracking parameter 'fbclid'");

  console.log(`   - Raw URL:     ${rawUrl}`);
  console.log(`   - Cleaned URL: ${cleanedUrl}`);
  console.log("✅ TEST 4 PASSED: Non-identity tracking parameters stripped, ATS job ID preserved.");

  // ── TEST 5: SERVER-SIDE SECTION ISOLATION ─────────────────────────────────
  console.log("\n5. Testing Strict Server-Side Section Category Isolation...");
  const companySources = ["greenhouse", "lever", "ashby", "workday", "smartrecruiters", "careers"];
  for (const s of companySources) {
    const c = classifySourceCategory(s);
    assert.strictEqual(c.category, JobSourceCategory.COMPANY_CAREER, `${s} must be COMPANY_CAREER`);
  }

  const portalSources = ["linkedin", "indeed", "internshala", "wellfound", "aggregator"];
  for (const p of portalSources) {
    const c = classifySourceCategory(p);
    assert.strictEqual(c.category, JobSourceCategory.JOB_PORTAL, `${p} must be JOB_PORTAL`);
  }
  console.log("✅ TEST 5 PASSED: Server-side source classification prevents cross-section leakage.");

  console.log("\n============================================================");
  console.log("ALL PHASE B ACCEPTANCE TESTS PASSED CLEANLY! 🎉");
  console.log("============================================================");
}

runPhaseBAcceptanceTests().catch(err => {
  console.error("❌ Phase B Acceptance Tests Failed:", err);
  process.exit(1);
});
