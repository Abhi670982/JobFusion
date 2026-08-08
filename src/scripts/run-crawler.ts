import { crawlPortalJobs } from "../lib/portal-fetcher/crawler";
import { persistPortalJobs } from "../lib/portal-jobs-persist";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("============================================================");
  console.log("=== GOHYRED DIRECT CRAWLER EXECUTION RUNNER ===");
  console.log("============================================================");

  // 1. Verify Database Connection
  try {
    await prisma.$connect();
    console.log("[Preflight DB Check] Connected to PostgreSQL successfully.");
  } catch (dbErr: any) {
    console.error("[Preflight DB Error] Failed to connect to PostgreSQL:", dbErr.message || dbErr);
    process.exit(1);
  }

  // 2. Preflight API Service Check
  const hasApify = Boolean(process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN);
  const hasSerpApi = Boolean(process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY);
  const hasBrightData = Boolean(process.env.BRIGHTDATA_API_KEY || process.env.BRIGHTDATA_KEY);

  console.log(`[Preflight Services] Apify: ${hasApify ? "Configured" : "Not configured (fallback mode)"}`);
  console.log(`[Preflight Services] SerpAPI: ${hasSerpApi ? "Configured" : "Not configured (fallback mode)"}`);
  console.log(`[Preflight Services] BrightData: ${hasBrightData ? "Configured" : "Not configured (fallback mode)"}`);

  // 3. Execute Multi-Portal Crawl
  console.log("[Crawl Runner] Executing multi-portal job crawl...");
  const crawlRes = await crawlPortalJobs({
    portal: "all",
    location: "India",
    maxPages: 3,
  });

  // 4. Persist Results into Database
  console.log(`[Crawl Runner] Persisting ${crawlRes.jobs.length} jobs to PostgreSQL...`);
  const persistRes = await persistPortalJobs(crawlRes.jobs);

  console.log("============================================================");
  console.log("=== CRAWL EXECUTION METRICS ===");
  console.log(`Pages Crawled: ${crawlRes.metrics.totalPagesCrawled}`);
  console.log(`Jobs Discovered: ${crawlRes.metrics.jobsDiscovered}`);
  console.log(`Jobs Inserted: ${persistRes.jobsInserted}`);
  console.log(`Jobs Updated: ${persistRes.jobsUpdated}`);
  console.log(`Duplicates Skipped: ${crawlRes.metrics.duplicatesSkipped + persistRes.duplicatesSkipped}`);
  console.log(`Failed Requests: ${crawlRes.metrics.failedRequests}`);
  console.log("============================================================");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("[Crawler Runner Fatal Error]:", err);
  await prisma.$disconnect();
  process.exit(1);
});
