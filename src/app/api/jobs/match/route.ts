import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const jobPortals = [
  { source: "Indeed", domain: "indeed.com" },
  { source: "Google Jobs", domain: "google.com/search?q=jobs" },
  { source: "LinkedIn", domain: "linkedin.com" },
  { source: "Glassdoor", domain: "glassdoor.com" },
  { source: "SimplyHired", domain: "simplyhired.com" }
];

const mockLocations = [
  "Bengaluru, Karnataka",
  "Mumbai, Maharashtra",
  "Noida, Uttar Pradesh",
  "Chennai, Tamil Nadu",
  "Hyderabad, Telangana"
];

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanTitleForSearch(title: string): string {
  let clean = title
    .replace(/[\(\[][^\)\]]*[\)\]]/g, "") // remove parentheses/brackets
    .replace(/\b(?:remote|india|us|usa|canada|uk|europe|london|germany|world|worldwide|timezone|utc|gmt|emea|latam|apac)\b/gi, "") // remove location/timezone keywords
    .replace(/[-|/\\+,;:]+$/g, "") // remove trailing punctuation
    .replace(/\s+/g, " ") // normalize whitespace
    .trim();
  
  if (clean.length < 5) return title; // Fallback if too short
  return clean;
}

function parseSalaryMin(salary: string, index: number): number {
  const matches = salary.match(/\b\d+(?:,\d+)*(?:\.\d+)?k?\b/gi);
  if (matches && matches[0]) {
    const cleanNum = matches[0].toLowerCase().replace(/[^0-9k]/g, "");
    let val = cleanNum.includes("k") 
      ? parseFloat(cleanNum) * 1000 
      : parseFloat(cleanNum);
    
    if (val < 1000) val = val * 85000; // E.g. $80k -> INR equivalent
    return Math.floor(val);
  }
  return 1500000 + (index * 200000);
}

function parseSalaryMax(salary: string, index: number, min: number): number {
  const matches = salary.match(/\b\d+(?:,\d+)*(?:\.\d+)?k?\b/gi);
  if (matches && matches[1]) {
    const cleanNum = matches[1].toLowerCase().replace(/[^0-9k]/g, "");
    let val = cleanNum.includes("k") 
      ? parseFloat(cleanNum) * 1000 
      : parseFloat(cleanNum);
    
    if (val < 1000) val = val * 85000;
    return Math.floor(val);
  }
  return min + 600000 + (index * 150000);
}

function mapJob(j: any) {
  if (!j) return null;
  return {
    _id: j.id,
    title: j.title,
    company: j.company,
    companyLogo: j.companyLogo,
    companyColor: j.companyColor,
    location: j.location,
    locationType: j.locationType === "remote" ? "remote" : (j.locationType === "onsite" ? "onsite" : "hybrid"),
    salary: j.salary,
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    experience: j.experience,
    experienceLevel: j.experienceLevel,
    type: j.type === "full_time" ? "full-time" : (j.type === "part_time" ? "part-time" : j.type),
    skills: j.skills,
    matchScore: j.matchScore,
    postedAt: j.postedAt,
    postedAtDate: j.postedAtDate,
    description: j.description,
    requirements: j.requirements,
    responsibilities: j.responsibilities,
    benefits: j.benefits,
    applicants: j.applicants,
    featured: j.featured,
    category: j.category,
    source: j.source,
    applyUrl: j.applyUrl,
    dedupeHash: j.dedupeHash,
    isActive: j.isActive,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, skills } = body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      // If no skills are provided, return all jobs from DB
      const pgJobs = await prisma.job.findMany({
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({
        success: true,
        data: pgJobs.map(mapJob),
        matchedCount: 0
      });
    }

    console.log(`[Job Matching] Fetching live jobs for skills: ${skills.join(", ")}`);

    // 1. Fetch live jobs from Himalayas API concurrently for the first 4 skills
    const fetchedJobs: any[] = [];
    const skillsToQuery = skills.slice(0, 4);

    await Promise.all(skillsToQuery.map(async (skill) => {
      try {
        const url = `https://himalayas.app/jobs/api/search?q=${encodeURIComponent(skill)}&limit=10`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.jobs && Array.isArray(data.jobs)) {
            data.jobs.forEach((job: any) => {
              job.querySkill = skill;
              fetchedJobs.push(job);
            });
          }
        }
      } catch (err) {
        console.error(`Failed to fetch jobs from Himalayas for skill: ${skill}`, err);
      }
    }));

    console.log(`[Job Matching] Live fetch completed. Found ${fetchedJobs.length} potential openings.`);

    const dbMatchedJobs: any[] = [];

    // 2. Map and upsert live jobs into PostgreSQL using Prisma
    if (fetchedJobs.length > 0) {
      for (let i = 0; i < fetchedJobs.length; i++) {
        const item = fetchedJobs[i];
        const skill = item.querySkill;
        const portal = jobPortals[i % jobPortals.length];
        const applyUrl = item.applicationLink || `https://himalayas.app/jobs?q=${encodeURIComponent(skill)}`;
        const category = (item.categories && item.categories[0]) || "Engineering";
        
        const rawDescription = item.description || "";
        const cleanDescription = rawDescription
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .substring(0, 8000); 

        const salaryMin = item.minSalary || parseSalaryMin(item.excerpt || "", i);
        const salaryMax = item.maxSalary || parseSalaryMax(item.excerpt || "", i, salaryMin);
        const salaryString = item.minSalary 
          ? `₹${Math.round(item.minSalary / 10000)}L – ₹${Math.round(item.maxSalary / 10000)}L` 
          : `₹${(salaryMin / 100000).toFixed(0)}L – ₹${(salaryMax / 100000).toFixed(0)}L`;

        const jobSkills = [skill];
        if (item.categories && Array.isArray(item.categories)) {
          item.categories.slice(0, 4).forEach((t: string) => {
            const formatted = t.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
            if (!jobSkills.includes(formatted) && formatted.length < 20) {
              jobSkills.push(formatted);
            }
          });
        }

        const location = (item.locationRestrictions && item.locationRestrictions[0]) || item.location || mockLocations[i % mockLocations.length];
        
        const companyColor = 
          portal.source === 'LinkedIn' ? '#0077B5' : 
          portal.source === 'Indeed' ? '#003A9B' : 
          portal.source === 'Glassdoor' ? '#0CAA41' : 
          portal.source === 'Google Jobs' ? '#EA4335' : 
          portal.source === 'SimplyHired' ? '#6366F1' : 
          '#6366F1';

        const hashInput = `${item.title.trim().toLowerCase()}-${(item.companyName || "Unknown Company").trim().toLowerCase()}`;
        const dedupeHash = crypto.createHash("md5").update(hashInput).digest("hex");

        try {
          // Upsert in Postgres
          const pgJob = await prisma.job.upsert({
            where: { dedupeHash },
            create: {
              dedupeHash,
              title: item.title,
              company: item.companyName || "Unknown Company",
              companyLogo: item.companyLogo || (item.companyName ? item.companyName.charAt(0) : "J"),
              companyColor,
              location,
              locationType: "remote",
              salary: salaryString,
              salaryMin,
              salaryMax,
              experience: "2-5 years",
              experienceLevel: "mid",
              type: "full_time",
              skills: jobSkills,
              matchScore: 82 + (i % 15),
              postedAt: "1 day ago",
              description: cleanDescription,
              requirements: [
                `Proven professional experience working with ${skill}`,
                "Collaborate effectively in a remote/distributed engineering team",
                "Strong analytical and web problem-solving capabilities"
              ],
              responsibilities: [
                `Design and develop modular components utilizing ${skill}`,
                "Work closely with designers, product managers, and remote developers",
                "Maintain, optimize, and document core web applications"
              ],
              benefits: [
                "Competitive remote compensation pack",
                "Flexible vacation policy and work-from-home allowance",
                "Health, dental, and vision insurance coverage"
              ],
              applicants: Math.floor(Math.random() * 20) + 4,
              featured: i % 4 === 0,
              category,
              source: portal.source,
              applyUrl
            },
            update: {
              companyLogo: item.companyLogo || (item.companyName ? item.companyName.charAt(0) : "J"),
              companyColor,
              location,
              salary: salaryString,
              salaryMin,
              salaryMax,
              skills: jobSkills,
              applyUrl
            }
          });

          dbMatchedJobs.push(pgJob);
        } catch (dbErr) {
          console.error("Failed to save live job to Postgres:", dbErr);
        }
      }
    }

    // 3. Fallback: If live fetch fails, query database matching skills
    if (dbMatchedJobs.length === 0) {
      console.warn("[Job Matching] Live fetch returned 0 jobs. Falling back to DB search...");
      const fallbackJobs = await prisma.job.findMany({
        where: {
          skills: {
            hasSome: skills
          }
        },
        orderBy: { createdAt: "desc" }
      });
      
      return NextResponse.json({
        success: true,
        data: fallbackJobs.map(mapJob),
        matchedCount: fallbackJobs.length
      });
    }

    return NextResponse.json({
      success: true,
      data: dbMatchedJobs.map(mapJob),
      matchedCount: dbMatchedJobs.length
    });

  } catch (error: any) {
    console.error("Error in POST /api/jobs/match:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to match jobs" },
      { status: 500 }
    );
  }
}
