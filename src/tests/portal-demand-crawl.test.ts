import assert from "assert";
import { bootstrapSeedSkills, recordSkillDemand, getSkillsToCrawl, updateSkillCrawlStatus } from "@/lib/portal-fetcher/skill-registry";
import { registerPortalsScheduler, PORTALS_SCHEDULER_ID } from "@/lib/scheduler";
import { CrawlStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function runPortalDemandCrawlTests() {
  console.log("==================================================");
  console.log("🧪 Running Milestone 2: TrackedSkill & Demand Crawl Tests");
  console.log("==================================================");

  // Clean up any previous test skills
  await prisma.trackedSkill.deleteMany({
    where: {
      name: { in: ["graphql", "rust"] },
    },
  });

  // Test 1: Seed Skills Bootstrapping
  console.log("\n[Test 1] Seed Skills Bootstrapping");
  const seededCount = await bootstrapSeedSkills();
  assert.strictEqual(seededCount >= 10, true, "Bootstrapped at least 10 seed skills");
  console.log(`✅ Passed: Bootstrapped ${seededCount} seed skills into tracked_skills table`);

  // Test 2: Record User Skill Demand
  console.log("\n[Test 2] Record User Skill Demand");
  const userExtractedSkills = ["GraphQL", "Rust", "TypeScript"];
  await recordSkillDemand(userExtractedSkills);

  const rustSkill = await prisma.trackedSkill.findUnique({
    where: { name: "rust" },
  });
  assert.strictEqual(Boolean(rustSkill), true, "Rust skill recorded");
  assert.strictEqual(rustSkill?.demandCount, 1, "Rust demand count initialized to 1");
  console.log("✅ Passed: User skill demand recorded successfully");

  // Test 3: Get Top Skills to Crawl
  console.log("\n[Test 3] Get Top Demand Skills to Crawl");
  const topSkills = await getSkillsToCrawl(5);
  assert.strictEqual(Array.isArray(topSkills), true, "Returns skills array");
  assert.strictEqual(topSkills.length <= 5, true, "Respects limit parameter");
  console.log(`✅ Top Skills to Crawl: ${topSkills.join(", ")}`);

  // Test 4: Operational Metadata Update
  console.log("\n[Test 4] Operational Crawl Status Update");
  const updatedRust = await updateSkillCrawlStatus("rust", CrawlStatus.success);
  assert.strictEqual(updatedRust.crawlStatus, CrawlStatus.success, "Status updated to success");
  assert.strictEqual(Boolean(updatedRust.lastCrawledAt), true, "lastCrawledAt timestamp updated");
  console.log("✅ Passed: Skill operational metadata updated cleanly");

  // Test 5: Register Daily Portals Scheduler
  console.log("\n[Test 5] Daily Portals Scheduler Registration");
  const schedRes = await registerPortalsScheduler();
  assert.strictEqual(schedRes.schedulerId, PORTALS_SCHEDULER_ID, "Scheduler ID matches PORTALS_SCHEDULER_ID");
  assert.strictEqual(schedRes.cadenceHours, 24, "Cadence is 24 hours (1x per day)");
  console.log("✅ Passed: Daily portals scheduler registered with 24-hour cadence");

  // Cleanup test artifacts
  await prisma.trackedSkill.deleteMany({
    where: {
      name: { in: ["graphql", "rust"] },
    },
  });

  console.log("==================================================");
  console.log("🎉 Milestone 2 Tests Completed Successfully!");
  console.log("==================================================");
}

runPortalDemandCrawlTests().catch(err => {
  console.error("❌ Test runner error:", err);
  process.exit(1);
});
