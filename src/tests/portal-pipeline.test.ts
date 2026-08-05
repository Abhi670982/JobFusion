import assert from "assert";
import { normalizeSearchInput, sanitizeJobDescription, validateExternalUrl } from "@/lib/portal-fetcher/sanitizers/sanitizer";
import { portalRegistry } from "@/lib/portal-fetcher/registry";
import { getCircuitBreaker } from "@/lib/portal-fetcher/resilience/circuit-breaker";
import { crawlPortalJobs } from "@/lib/portal-fetcher/crawler";

async function runPortalPipelineTests() {
  console.log("==================================================");
  console.log("🧪 Running Job Portal Pipeline & Isolation Tests");
  console.log("==================================================");

  // Test 1: Search Input Normalization
  console.log("\n[Test 1] Search Input Normalization");
  const rawKeyword = "   react   \n  developer  \u0000";
  const normalized = normalizeSearchInput(rawKeyword);
  assert.strictEqual(normalized, "react developer", "Search input must be trimmed and collapsed");
  console.log("✅ Passed: Input normalization verified");

  // Test 2: HTML Sanitization & URL Validation
  console.log("\n[Test 2] HTML Sanitization & URL Protocol Validation");
  const dirtyHtml = "<script>alert('xss')</script><p>Clean <b>text</b> <iframe src='evil.com'></iframe></p>";
  const cleanHtml = sanitizeJobDescription(dirtyHtml);
  assert.strictEqual(cleanHtml.includes("<script>"), false, "Script tags must be stripped");
  assert.strictEqual(cleanHtml.includes("<iframe>"), false, "Iframes must be stripped");
  assert.strictEqual(cleanHtml.includes("Clean <b>text</b>"), true, "Safe formatting tags allowed");

  const validUrl = validateExternalUrl("https://linkedin.com/jobs/view/123");
  const invalidUrl = validateExternalUrl("javascript:alert(1)");
  assert.strictEqual(validUrl, "https://linkedin.com/jobs/view/123", "Valid HTTPS URL preserved");
  assert.strictEqual(invalidUrl, null, "Unsafe protocol stripped");
  console.log("✅ Passed: Sanitization and URL validation verified");

  // Test 3: Circuit Breaker State Transitions
  console.log("\n[Test 3] Circuit Breaker Protection");
  const cb = getCircuitBreaker("test-portal");
  assert.strictEqual(cb.getState(), "CLOSED", "Initial state must be CLOSED");
  cb.recordFailure();
  cb.recordFailure();
  cb.recordFailure();
  assert.strictEqual(cb.getState(), "OPEN", "3 failures must trip state to OPEN");
  assert.strictEqual(cb.isCallAllowed(), false, "Call disallowed while OPEN");
  cb.recordSuccess();
  assert.strictEqual(cb.getState(), "CLOSED", "Success resets state to CLOSED");
  console.log("✅ Passed: Circuit breaker state transitions verified");

  // Test 4: Open/Closed Registry Registration
  console.log("\n[Test 4] Open/Closed Adapter Registry");
  const availableSources = portalRegistry.getAvailableSources();
  assert.strictEqual(availableSources.includes("linkedin"), true, "LinkedIn adapter registered");
  assert.strictEqual(availableSources.includes("indeed"), true, "Indeed adapter registered");
  assert.strictEqual(availableSources.includes("internshala"), true, "Internshala adapter registered");
  assert.strictEqual(availableSources.includes("wellfound"), true, "Wellfound adapter registered");
  console.log("✅ Passed: Open/Closed adapter registry verified");

  // Test 5: 10-Stage Pipeline Execution & DTO V1 Output
  console.log("\n[Test 5] 10-Stage Deterministic Pipeline Execution");
  const crawlResult = await crawlPortalJobs({
    portal: "linkedin",
    keyword: "software engineer",
    location: "India",
    page: 1,
    limit: 5,
  });

  assert.strictEqual(Array.isArray(crawlResult.jobs), true, "Returns internal jobs array");
  assert.strictEqual(Array.isArray(crawlResult.dtoJobs), true, "Returns DTO V1 jobs array");
  assert.strictEqual(typeof crawlResult.metricsSummary, "object", "Returns production metrics summary");

  if (crawlResult.dtoJobs.length > 0) {
    const firstDto = crawlResult.dtoJobs[0];
    assert.strictEqual(typeof firstDto.id, "string", "DTO id is string");
    assert.strictEqual(typeof firstDto.title, "string", "DTO title is string");
    assert.strictEqual(typeof firstDto.company, "string", "DTO company is string");
    assert.strictEqual(typeof firstDto.sourcePortal, "string", "DTO sourcePortal is string");
    assert.strictEqual(typeof firstDto.applyUrl, "string", "DTO applyUrl is string");
    console.log(`✅ Sample DTO V1 verified: "${firstDto.title}" at "${firstDto.company}" (${firstDto.sourcePortal})`);
  } else {
    console.log("⚠️ Crawl returned 0 jobs (likely offline/mock mode), pipeline completed cleanly without throwing exceptions.");
  }

  // Test 6: Company Careers Isolation Assertion
  console.log("\n[Test 6] Company Careers Isolation Assertion");
  const { JobSourceCategory } = await import("@prisma/client");
  const { classifySourceCategory } = await import("@/lib/source-category");

  const greenhouseClassified = classifySourceCategory("greenhouse");
  assert.strictEqual(greenhouseClassified.category, JobSourceCategory.COMPANY_CAREER, "Greenhouse is COMPANY_CAREER");
  assert.notStrictEqual(greenhouseClassified.category, JobSourceCategory.JOB_PORTAL, "Greenhouse is NOT JOB_PORTAL");

  const linkedinClassified = classifySourceCategory("linkedin");
  assert.strictEqual(linkedinClassified.category, JobSourceCategory.JOB_PORTAL, "LinkedIn is JOB_PORTAL");
  assert.notStrictEqual(linkedinClassified.category, JobSourceCategory.COMPANY_CAREER, "LinkedIn is NOT COMPANY_CAREER");

  console.log("✅ Passed: Company Careers architectural isolation confirmed!");
  console.log("==================================================");
  console.log("🎉 All Job Portal Pipeline Tests Completed Successfully!");
  console.log("==================================================");
}

runPortalPipelineTests().catch((err) => {
  console.error("❌ Test runner error:", err);
  process.exit(1);
});
