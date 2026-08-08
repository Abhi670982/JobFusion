if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/gohyred?schema=public";
}

import { AdapterRegistry } from "../../lib/adapters/AdapterRegistry";
import "../../lib/adapters/index"; // Self-registers all adapters
import { AdapterSource } from "../../lib/types/normalizedJob";

// Sample target configurations for live verification
const SAMPLE_CONFIGS: Record<AdapterSource, any> = {
  workday: {
    host: "adobe.wd5.myworkdayjobs.com",
    tenant: "adobe",
    siteId: "external_experienced",
    companyName: "Adobe",
  },
  greenhouse: {
    slug: "stripe",
    companyName: "Stripe",
  },
  lever: {
    slug: "cred",
    companyName: "CRED",
  },
  ashby: {
    slug: "notion",
    companyName: "Notion",
  },
  smartrecruiters: {
    slug: "uber",
    companyName: "Uber",
  },
  recruitee: {
    slug: "hotjar",
    companyName: "Hotjar",
  },
};

async function verifyAllAdapters() {
  console.log("============================================================");
  console.log("=== PHASE D3 WAVE 2: MANUAL DEVELOPER ADAPTER VERIFICATION ===");
  console.log("============================================================");

  const adapters = AdapterRegistry.getAllAdapters();
  console.log(`Discovered ${adapters.length} registered ATS adapter(s) in AdapterRegistry:\n`);

  for (const adapter of adapters) {
    const source = adapter.source;
    const config = SAMPLE_CONFIGS[source];

    console.log(`------------------------------------------------------------`);
    console.log(`▶ ADAPTER: ${source.toUpperCase()}`);
    console.log(`  Sample Target Config:`, JSON.stringify(config));

    if (!config) {
      console.log(`  ⚠️ Status: SKIPPED (No sample configuration defined for "${source}")`);
      continue;
    }

    try {
      const startTime = Date.now();
      const jobs = await adapter.fetchJobs(config);
      const elapsedMs = Date.now() - startTime;
      const metrics = adapter.getHealthMetrics();

      console.log(`  Status:             ✅ SUCCESS (${elapsedMs}ms)`);
      console.log(`  Normalized Jobs:    ${jobs.length}`);

      if (jobs.length > 0) {
        console.log(`  Sample First Job:`);
        console.log(JSON.stringify(jobs[0], null, 2));
      } else {
        console.log(`  Sample First Job:   (None matched filters / locations)`);
      }

      console.log(`  Validation Failures: ${metrics.jobsDiscarded}`);
      console.log(`  Health Metrics:`, JSON.stringify(metrics, null, 2));
    } catch (err: any) {
      console.log(`  Status:             ❌ FAILURE`);
      console.log(`  Error Message:      ${err.message}`);
      console.log(`  Health Metrics:`, JSON.stringify(adapter.getHealthMetrics(), null, 2));
    }

    console.log(`------------------------------------------------------------\n`);
  }

  console.log("============================================================");
  console.log("VERIFICATION COMPLETE (No database or pipeline state mutated)");
  console.log("============================================================");
}

verifyAllAdapters().catch((err) => {
  console.error("❌ Adapter verification script error:", err);
  process.exit(1);
});
