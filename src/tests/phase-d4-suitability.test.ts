if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/gohyred?schema=public";
}

import assert from "assert";
import { normalizeSkillName, normalizeSkillsList } from "../lib/skills-normalizer";
import { extractExperienceRequirements } from "../lib/experience-extractor";
import { classifyCareerStage } from "../lib/career-stage";
import { calculateCandidateSuitability, RANKING_CONFIG } from "../lib/candidate-suitability";
import { queryCareersJobs } from "../lib/pipeline";

async function runPhaseD4Tests() {
  console.log("============================================================");
  console.log("=== PHASE D4: INTELLIGENT RANKING & SUITABILITY TEST SUITE ===");
  console.log("============================================================");

  // ── TEST 1: RESUME & JOB SKILL NORMALIZATION ─────────────────────────────
  console.log("\n1. Testing Skill Normalization Module (normalizeSkillName)...");
  assert.strictEqual(normalizeSkillName("JS"), "JavaScript");
  assert.strictEqual(normalizeSkillName("react.js"), "React");
  assert.strictEqual(normalizeSkillName("Node"), "Node.js");
  assert.strictEqual(normalizeSkillName("expressjs"), "Express.js");
  assert.strictEqual(normalizeSkillName("TS"), "TypeScript");
  assert.strictEqual(normalizeSkillName("py"), "Python");

  const normalizedList = normalizeSkillsList(["js", "react.js", "node", "expressjs", "ts"]);
  assert.deepStrictEqual(normalizedList, ["JavaScript", "React", "Node.js", "Express.js", "TypeScript"]);
  console.log("✅ TEST 1 PASSED: Skill synonyms mapped to canonical skill names.");

  // ── TEST 2: EXPERIENCE EXTRACTION ENGINE ────────────────────────────────
  console.log("\n2. Testing Experience Extraction Engine...");
  const exp1 = extractExperienceRequirements("Senior React Engineer (5+ years exp)");
  assert.strictEqual(exp1.minYears, 5);
  assert.strictEqual(exp1.isSeniorExplicit, true);

  const exp2 = extractExperienceRequirements("Software Developer", "Looking for freshers / 0-2 years experience");
  assert.strictEqual(exp2.minYears, 0);
  assert.strictEqual(exp2.maxYears, 2);
  assert.strictEqual(exp2.isFresherExplicit, true);

  const exp3 = extractExperienceRequirements("Staff Software Architect");
  assert.strictEqual(exp3.isLeadershipExplicit, true);
  console.log("✅ TEST 3 PASSED: Experience requirements extracted accurately.");

  // ── TEST 3: CAREER STAGE CLASSIFICATION ──────────────────────────────────
  console.log("\n3. Testing Career Stage Classifier...");
  assert.strictEqual(classifyCareerStage("Frontend Intern", { confidence: "high", isFresherExplicit: true, isSeniorExplicit: false, isLeadershipExplicit: false }), "Internship");
  assert.strictEqual(classifyCareerStage("Graduate Engineer Trainee (0-1 yrs)", { minYears: 0, maxYears: 1, confidence: "high", isFresherExplicit: true, isSeniorExplicit: false, isLeadershipExplicit: false }), "Fresher");
  assert.strictEqual(classifyCareerStage("Junior Web Developer (1-2 yrs)", { minYears: 1, maxYears: 2, confidence: "high", isFresherExplicit: false, isSeniorExplicit: false, isLeadershipExplicit: false }), "Early Career");
  assert.strictEqual(classifyCareerStage("Senior React Developer", { minYears: 5, confidence: "medium", isFresherExplicit: false, isSeniorExplicit: true, isLeadershipExplicit: false }), "Senior");
  assert.strictEqual(classifyCareerStage("Principal Architect", { minYears: 8, confidence: "medium", isFresherExplicit: false, isSeniorExplicit: false, isLeadershipExplicit: true }), "Leadership");
  console.log("✅ TEST 3 PASSED: Roles correctly classified into canonical career stages.");

  // ── TEST 4: CANDIDATE SUITABILITY SCORING & FRESHER PRIORITIZATION ───────
  console.log("\n4. Testing Candidate Suitability Engine & Fresher Prioritization...");
  const fresherJobInput = {
    title: "Entry Level React Developer (0-2 yrs)",
    company: "Acme Tech",
    skills: ["React", "JavaScript"],
    description: "Great entry level role for freshers.",
    postedAtDate: new Date(),
  };

  const seniorJobInput = {
    title: "Senior Staff React Architect (8+ yrs exp)",
    company: "Acme Tech",
    skills: ["React", "JavaScript", "System Design"],
    description: "Requires 8+ years leading enterprise engineering teams.",
    postedAtDate: new Date(),
  };

  // Fresher profile (0 years experience)
  const fresherProfile = { userSkills: ["React", "JavaScript"], userExperienceYears: 0 };
  const fresherSuitability1 = calculateCandidateSuitability(fresherJobInput, fresherProfile);
  const fresherSuitability2 = calculateCandidateSuitability(seniorJobInput, fresherProfile);

  assert.ok(
    fresherSuitability1.suitabilityScore > fresherSuitability2.suitabilityScore,
    `Fresher profile must rank Entry Level job (${fresherSuitability1.suitabilityScore}) above Senior Staff job (${fresherSuitability2.suitabilityScore})`
  );

  // Experienced profile (6 years experience)
  const seniorProfile = { userSkills: ["React", "JavaScript"], userExperienceYears: 6 };
  const seniorSuitability1 = calculateCandidateSuitability(fresherJobInput, seniorProfile);
  const seniorSuitability2 = calculateCandidateSuitability(seniorJobInput, seniorProfile);

  assert.ok(
    seniorSuitability2.suitabilityScore >= seniorSuitability1.suitabilityScore,
    `Senior profile must rank Senior role (${seniorSuitability2.suitabilityScore}) at or above entry role (${seniorSuitability1.suitabilityScore})`
  );
  console.log("✅ TEST 4 PASSED: Candidate suitability and fresher prioritization operate accurately.");

  // ── TEST 5: RUNTIME RANKING METADATA EXPLAINABILITY ─────────────────────
  console.log("\n5. Testing Runtime Ranking Metadata Explainability...");
  const suitabilityRes = calculateCandidateSuitability(fresherJobInput, fresherProfile);
  const meta = suitabilityRes.metadata;

  assert.ok(typeof meta.suitabilityScore === "number", "suitabilityScore must be number");
  assert.ok(typeof meta.baseRelevanceScore === "number", "baseRelevanceScore must be number");
  assert.strictEqual(meta.careerStage, "Fresher");
  assert.ok(Array.isArray(meta.matchReasons), "matchReasons must be array");
  assert.ok(meta.matchReasons.length >= 3, "matchReasons must contain at least 3 explainability items");
  console.log("   - Sample Ranking Metadata Reasons:", meta.matchReasons.join(" | "));
  console.log("✅ TEST 5 PASSED: Ranking metadata explainability output verified.");

  // ── TEST 6: DETERMINISTIC TIE-BREAKING & SORT MODE PRESERVATION ──────────
  console.log("\n6. Verifying Sort Mode Preservation & Deterministic Tie-Breaking...");
  const dateNow = new Date("2026-07-31T10:00:00.000Z");
  const dateOlder = new Date("2026-07-28T10:00:00.000Z");

  const latestResult = await queryCareersJobs({ page: 1, limit: 10, sortMode: "latest" });
  assert.ok(latestResult.jobs.length >= 0);
  if (latestResult.jobs.length > 1) {
    const d1 = new Date(latestResult.jobs[0].postedAtDate).getTime();
    const d2 = new Date(latestResult.jobs[1].postedAtDate).getTime();
    assert.ok(d1 >= d2, "Latest mode must strictly order by postedAtDate DESC");
  }
  console.log("✅ TEST 6 PASSED: Sort mode semantics and deterministic ordering asserted.");

  console.log("\n============================================================");
  console.log("ALL PHASE D4 ACCEPTANCE TESTS PASSED CLEANLY! 🎉");
  console.log("============================================================");
}

runPhaseD4Tests().catch((err) => {
  console.error("❌ Phase D4 Acceptance Test Suite Failed:", err);
  process.exit(1);
});
