import assert from "assert";
import { isTechnologyRole, getTechnologyRolesToCrawl, SUPPORTED_TECH_ROLES } from "@/lib/portal-fetcher/config/tech-roles";

async function runTechFilteringTests() {
  console.log("==================================================");
  console.log("🧪 Running Technology Role Filtering Verification");
  console.log("==================================================");

  // Test 1: Configuration list validation
  console.log("\n[Test 1] Configuration-Driven Supported Tech Roles");
  const techRoles = getTechnologyRolesToCrawl();
  assert.strictEqual(Array.isArray(techRoles), true, "getTechnologyRolesToCrawl returns array");
  assert.strictEqual(techRoles.length >= 21, true, "At least 21 tech roles configured");
  assert.strictEqual(techRoles[0].role, "Software Engineer", "Highest priority role is Software Engineer");
  console.log(`✅ Configured ${techRoles.length} technology roles sorted by priority.`);

  // Test 2: Accept Genuine Tech Job Titles
  console.log("\n[Test 2] Accept Genuine Technology Job Titles");
  const validTitles = [
    "Senior Software Engineer",
    "Frontend Developer (React)",
    "Backend Developer (Node.js)",
    "Full Stack Web Developer",
    "iOS Mobile App Developer",
    "DevOps & Cloud Engineer",
    "Data Engineer (PySpark)",
    "Data Scientist",
    "Machine Learning Engineer",
    "AI/ML Engineer",
    "QA Automation Engineer",
    "SDET II",
    "Cybersecurity Analyst",
    "UI/UX Engineer",
    "Site Reliability Engineer (SRE)",
    "Software Engineering Intern",
  ];

  for (const title of validTitles) {
    const accepted = isTechnologyRole(title);
    assert.strictEqual(accepted, true, `Should ACCEPT tech title: "${title}"`);
  }
  console.log(`✅ Passed: Accepted all ${validTitles.length} valid technology job titles.`);

  // Test 3: Reject Non-Technical Job Titles
  console.log("\n[Test 3] Reject Non-Technical Job Titles");
  const nonTechTitles = [
    "Sales Executive",
    "Business Development Manager",
    "Digital Marketing Specialist",
    "HR Recruiter",
    "Talent Acquisition Associate",
    "Accountant",
    "Financial Analyst",
    "Operations Manager",
    "Customer Support Representative",
    "Telecaller",
    "Office Administrator",
    "Receptionist",
    "Civil Site Engineer",
    "Mechanical Design Engineer",
  ];

  for (const title of nonTechTitles) {
    const accepted = isTechnologyRole(title);
    assert.strictEqual(accepted, false, `Should REJECT non-tech title: "${title}"`);
  }
  console.log(`✅ Passed: Rejected all ${nonTechTitles.length} non-technical job titles.`);

  console.log("==================================================");
  console.log("🎉 Technology Role Filtering Verified Successfully!");
  console.log("==================================================");
}

runTechFilteringTests().catch((err) => {
  console.error("❌ Test runner error:", err);
  process.exit(1);
});
