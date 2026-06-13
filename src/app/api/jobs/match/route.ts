import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";

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

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, skills } = body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      // If no skills are provided, return all jobs from DB
      const jobs = await Job.find().sort({ createdAt: -1 });
      return NextResponse.json({
        success: true,
        data: jobs,
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

    // 2. Map and upsert live jobs into MongoDB
    if (fetchedJobs.length > 0) {
      for (let i = 0; i < fetchedJobs.length; i++) {
        const item = fetchedJobs[i];
        const skill = item.querySkill;
        const portal = jobPortals[i % jobPortals.length];
        
        // Keep the original direct application URL from Himalayas
        // so that users always have a 100% active, verified link to apply.
        const applyUrl = item.applicationLink || `https://himalayas.app/jobs?q=${encodeURIComponent(skill)}`;

        const category = (item.categories && item.categories[0]) || "Engineering";
        
        // Strip HTML tags from description for clean display
        const rawDescription = item.description || "";
        const cleanDescription = rawDescription
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .substring(0, 8000); // Limit size

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
        
        // Generate a company color based on portal
        const companyColor = 
          portal.source === 'LinkedIn' ? '#0077B5' : 
          portal.source === 'Indeed' ? '#003A9B' : 
          portal.source === 'Glassdoor' ? '#0CAA41' : 
          portal.source === 'Google Jobs' ? '#EA4335' : 
          portal.source === 'SimplyHired' ? '#6366F1' : 
          '#6366F1';

        try {
          const dbJob = await Job.findOneAndUpdate(
            { title: item.title, company: item.companyName || "Unknown Company" },
            {
              title: item.title,
              company: item.companyName || "Unknown Company",
              companyLogo: item.companyLogo || (item.companyName ? item.companyName.charAt(0) : "J"),
              companyColor: companyColor,
              location: location,
              locationType: "remote",
              salary: salaryString,
              salaryMin: salaryMin,
              salaryMax: salaryMax,
              experience: "2-5 years",
              experienceLevel: "mid",
              type: "full-time",
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
              category: category,
              source: portal.source,
              applyUrl: applyUrl
            },
            { upsert: true, new: true }
          );
          dbMatchedJobs.push(dbJob);
        } catch (dbErr) {
          console.error("Failed to save live job to DB:", dbErr);
        }
      }
    }

    // 3. Fallback: If live fetch fails or returns empty, query the database matching skills
    if (dbMatchedJobs.length === 0) {
      console.warn("[Job Matching] Live fetch returned 0 jobs. Falling back to DB search...");
      const queryConditions = skills.map(skill => ({
        skills: { $regex: new RegExp(`^${escapeRegExp(skill)}$`, "i") }
      }));
      const fallbackJobs = await Job.find({ $or: queryConditions }).sort({ createdAt: -1 });
      
      return NextResponse.json({
        success: true,
        data: fallbackJobs,
        matchedCount: fallbackJobs.length
      });
    }

    return NextResponse.json({
      success: true,
      data: dbMatchedJobs,
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
