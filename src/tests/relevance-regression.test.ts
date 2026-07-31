import assert from "assert";
import { calculateDetailedRelevance, getRelevanceTier } from "../lib/relevance";

async function runRelevanceRegressionTests() {
  console.log("============================================================");
  console.log("=== PHASE D1: RELEVANCE QUALITY REGRESSION TEST SUITE ===");
  console.log("============================================================");

  // ── CASE A: Company-Name Leakage & Supporting-Only Exclusion ─────────────
  console.log("\nCase A: Testing Company-Name Leakage & Supporting-Only Exclusion...");
  const caseAResume = ["React", "Node.js", "TypeScript", "JavaScript", "Git"];
  const caseAJob = {
    title: "Senior Manager, Internal Audit - Audit Automation & Technology Risk",
    company: "GitLab",
    skills: ["git", "auditing"],
    description: "Internal audit manager responsible for risk assessments and technology compliance at GitLab.",
  };

  const caseAResult = calculateDetailedRelevance(caseAJob, caseAResume);
  console.log(`   - Score: ${caseAResult.score}%, Tier: ${caseAResult.tier}, Reason: ${caseAResult.eligibilityReason}`);
  assert.strictEqual(caseAResult.score, 0, "GitLab Audit Manager matching only 'git' must score 0%");
  assert.strictEqual(caseAResult.tier, "NONE", "GitLab Audit Manager must have tier NONE");
  console.log("✅ CASE A PASSED: Company-name leakage & supporting-only audit role filtered out.");

  // ── CASE B: Strong Multi-Core Match ───────────────────────────────────────
  console.log("\nCase B: Testing Strong Multi-Core Match...");
  const caseBResume = ["React", "TypeScript", "JavaScript"];
  const caseBJob = {
    title: "Principal Software Engineer (React/Javascript/Typescript)",
    company: "Zscaler",
    skills: ["React", "JavaScript", "TypeScript"],
    description: "Lead development of frontend user interfaces using React, JavaScript, and TypeScript.",
  };

  const caseBResult = calculateDetailedRelevance(caseBJob, caseBResume);
  console.log(`   - Score: ${caseBResult.score}%, Tier: ${caseBResult.tier}`);
  assert.ok(caseBResult.score >= 70, `Expected score >= 70%, got ${caseBResult.score}%`);
  assert.strictEqual(caseBResult.tier, "HIGH", "Must be classified as HIGH tier");
  console.log("✅ CASE B PASSED: Principal React/TS Engineer classified as HIGH tier.");

  // ── CASE C: Core Skill + Description Match ───────────────────────────────
  console.log("\nCase C: Testing Core Skill + Description Match...");
  const caseCResume = ["Node.js", "JavaScript", "MongoDB"];
  const caseCJob = {
    title: "Backend Engineer",
    company: "Tech Corp",
    skills: ["Node.js", "MongoDB"],
    description: "Building scalable backend services using Node.js, JavaScript, and MongoDB database.",
  };

  const caseCResult = calculateDetailedRelevance(caseCJob, caseCResume);
  console.log(`   - Score: ${caseCResult.score}%, Tier: ${caseCResult.tier}`);
  assert.ok(caseCResult.score > 0, `Expected score > 0%, got ${caseCResult.score}%`);
  assert.ok(caseCResult.tier === "HIGH" || caseCResult.tier === "MODERATE", `Expected HIGH or MODERATE tier, got ${caseCResult.tier}`);
  console.log("✅ CASE C PASSED: Backend Engineer matching Node.js/MongoDB included cleanly.");

  // ── CASE D: Organizational Acronym Guard (REACT) ─────────────────────────
  console.log("\nCase D: Testing Organizational Acronym Guard (REACT)...");
  const caseDResume = ["React", "JavaScript"];
  const caseDJob = {
    title: "Incident Response Analyst - REACT",
    company: "Cloudflare",
    skills: ["security", "incident response"],
    description: "Cloudflare Response and Escalation Action Team (REACT) position focusing on SOC security incidents.",
  };

  const caseDResult = calculateDetailedRelevance(caseDJob, caseDResume);
  console.log(`   - Score: ${caseDResult.score}%, Tier: ${caseDResult.tier}`);
  assert.strictEqual(caseDResult.score, 0, "Incident Response Analyst with acronym REACT must score 0%");
  assert.strictEqual(caseDResult.tier, "NONE", "Must be classified as tier NONE");
  console.log("✅ CASE D PASSED: Organizational acronym REACT does NOT trigger false React score.");

  // ── CASE E: Tier Precedence Across Tiers (HIGH vs LOW) ─────────────────────
  console.log("\nCase E: Testing Tier Precedence Across Quality Tiers...");
  const nowMs = Date.now();
  const job1_HIGH = { id: "job1", score: 90, postedAtDate: new Date(nowMs - 30 * 3600 * 1000) }; // 30h ago
  const job2_LOW = { id: "job2", score: 15, postedAtDate: new Date(nowMs - 5 * 3600 * 1000) };  // 5h ago

  const jobsCaseE = [job2_LOW, job1_HIGH];
  jobsCaseE.sort((a, b) => {
    const aTier = a.score >= 70 ? 3 : a.score >= 35 ? 2 : 1;
    const bTier = b.score >= 70 ? 3 : b.score >= 35 ? 2 : 1;
    if (bTier !== aTier) return bTier - aTier;
    return new Date(b.postedAtDate).getTime() - new Date(a.postedAtDate).getTime();
  });

  console.log(`   - First sorted job: ${jobsCaseE[0].id} (score ${jobsCaseE[0].score}%, posted ${((nowMs - jobsCaseE[0].postedAtDate.getTime()) / 3600000).toFixed(0)}h ago)`);
  assert.strictEqual(jobsCaseE[0].id, "job1", "Tier HIGH (score 90%, 30h ago) must outrank Tier LOW (score 15%, 5h ago)");
  console.log("✅ CASE E PASSED: Tier HIGH outranks Tier LOW regardless of freshness.");

  // ── CASE F: Freshness Precedence Within Same Quality Tier ──────────────────
  console.log("\nCase F: Testing Freshness Precedence Within Same Quality Tier...");
  const jobF1 = { id: "jobF1", score: 90, postedAtDate: new Date(nowMs - 5 * 3600 * 1000) };  // 5h ago (HIGH)
  const jobF2 = { id: "jobF2", score: 100, postedAtDate: new Date(nowMs - 20 * 3600 * 1000) }; // 20h ago (HIGH)

  const jobsCaseF = [jobF2, jobF1];
  jobsCaseF.sort((a, b) => {
    const aTier = a.score >= 70 ? 3 : a.score >= 35 ? 2 : 1;
    const bTier = b.score >= 70 ? 3 : b.score >= 35 ? 2 : 1;
    if (bTier !== aTier) return bTier - aTier;
    return new Date(b.postedAtDate).getTime() - new Date(a.postedAtDate).getTime();
  });

  console.log(`   - First sorted job: ${jobsCaseF[0].id} (score ${jobsCaseF[0].score}%, posted ${((nowMs - jobsCaseF[0].postedAtDate.getTime()) / 3600000).toFixed(0)}h ago)`);
  assert.strictEqual(jobsCaseF[0].id, "jobF1", "Job 5h ago must outrank Job 20h ago within same HIGH tier");
  console.log("✅ CASE F PASSED: Freshness wins within the same quality tier.");

  console.log("\n============================================================");
  console.log("ALL RELEVANCE REGRESSION TESTS PASSED CLEANLY! 🎉");
  console.log("============================================================");
}

runRelevanceRegressionTests().catch((err) => {
  console.error("❌ Relevance Regression Tests Failed:", err);
  process.exit(1);
});
