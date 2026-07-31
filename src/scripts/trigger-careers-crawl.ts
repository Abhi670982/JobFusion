import { triggerManualScheduledCrawl } from "../lib/scheduler";
import { runSourceSync } from "../lib/pipeline";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("============================================================");
  console.log("=== MANUAL CONTROLLED CAREERS ACQUISITION TRIGGER ===");
  console.log("============================================================");

  const mode = process.argv[2] || "direct"; // "direct" or "queue"

  if (mode === "queue") {
    const res = await triggerManualScheduledCrawl();
    console.log(`[Trigger] Enqueued background crawl into BullMQ:`, res);
  } else {
    console.log("[Trigger] Running controlled Company Careers acquisition directly via pipeline...");
    const res = await runSourceSync("careers", ["software engineer"]);
    console.log("[Trigger] Acquisition execution complete. Summary metrics:", res.metrics);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("[Trigger Fatal Error]:", err);
  await prisma.$disconnect();
  process.exit(1);
});
