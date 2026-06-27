import { SourceAdapter, FetchQuery, UnifiedJob } from "./types";
import { extractSkills, PREDEFINED_SKILLS } from "@/lib/skills-extractor";
import { companies } from "@/lib/jobs/companySearchUrls";
import {
  fetchGreenhouseJobs,
  fetchLeverJobs,
  fetchAshbyJobs,
  fetchSmartRecruitersJobs,
  fetchRecruiteeJobs,
  RawATSJob
} from "./ats-apis";
import crypto from "crypto";

// Cache for ATS jobs
interface CacheEntry {
  timestamp: number;
  data: RawATSJob[];
}
const apiCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

// Helper to check in-memory cache and fetch jobs if cache is missing/expired
async function getCachedApiJobs(companyName: string, fetchFn: () => Promise<RawATSJob[]>): Promise<RawATSJob[]> {
  const cached = apiCache.get(companyName);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  
  try {
    const data = await fetchFn();
    apiCache.set(companyName, { timestamp: now, data });
    return data;
  } catch (err: any) {
    console.warn(`[Careers Adapter] API fetch failed for ${companyName} (${err.message}). Returning empty array.`);
    return [];
  }
}

// Sleep helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to match jobs with skills flexibly
function matchesSkill(title: string, skill: string): boolean {
  const tLower = title.toLowerCase();
  const sLower = skill.toLowerCase().trim();

  // 1. Direct substring match
  if (tLower.includes(sLower)) return true;

  // 2. Specific cases
  if (sLower.includes("frontend") || sLower.includes("front-end")) {
    return tLower.includes("frontend") || tLower.includes("front-end") || tLower.includes("ui") || tLower.includes("ux");
  }
  if (sLower.includes("backend") || sLower.includes("back-end")) {
    return tLower.includes("backend") || tLower.includes("back-end");
  }
  if (sLower.includes("fullstack") || sLower.includes("full-stack") || sLower.includes("full stack")) {
    return tLower.includes("fullstack") || tLower.includes("full-stack") || tLower.includes("full stack") || tLower.includes("fullstack");
  }
  if (sLower.includes("software engineer") || sLower.includes("software developer") || sLower === "developer" || sLower === "engineer") {
    return tLower.includes("software") || tLower.includes("engineer") || tLower.includes("developer") || tLower.includes("programmer");
  }

  // 3. Check aliases from PREDEFINED_SKILLS
  const skillDef = PREDEFINED_SKILLS.find(
    (p) => p.name.toLowerCase() === sLower || p.aliases.some(a => a.toLowerCase() === sLower)
  );
  if (skillDef) {
    for (const alias of skillDef.aliases) {
      if (tLower.includes(alias.toLowerCase())) return true;
    }
  }

  // 4. Split multi-word skill and check if all words are present
  const words = sLower.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 0) {
    const matchesAllWords = words.every(w => tLower.includes(w));
    if (matchesAllWords) return true;
  }

  return false;
}

export class CareersAdapter implements SourceAdapter {
  source = "careers" as const;

  async fetchJobs(query: FetchQuery): Promise<any[]> {
    const skill = query.keywords[0] || "software engineer";
    const allJobs: any[] = [];

    console.log(
      `[Careers Adapter] Starting public API crawl for skill: "${skill}" across ${companies.length} companies`
    );

    const BATCH_SIZE = 8;
    for (let i = 0; i < companies.length; i += BATCH_SIZE) {
      const batch = companies.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (company) => {
          try {
            let rawJobs: RawATSJob[] = [];
            
            if (company.atsType === "greenhouse") {
              rawJobs = await getCachedApiJobs(company.name, () => fetchGreenhouseJobs(company.slug));
            } else if (company.atsType === "lever") {
              rawJobs = await getCachedApiJobs(company.name, () => fetchLeverJobs(company.slug));
            } else if (company.atsType === "ashby") {
              rawJobs = await getCachedApiJobs(company.name, () => fetchAshbyJobs(company.slug));
            } else if (company.atsType === "smartrecruiters") {
              rawJobs = await getCachedApiJobs(company.name, () => fetchSmartRecruitersJobs(company.slug));
            } else if (company.atsType === "recruitee") {
              rawJobs = await getCachedApiJobs(company.name, () => fetchRecruiteeJobs(company.slug));
            }

            const relevant = rawJobs.filter((job) => matchesSkill(job.title, skill));

            for (const job of relevant) {
              allJobs.push({
                ...job,
                company: company.name,
                _isCareersCrawled: true,
                _skill: skill,
              });
            }
          } catch (err: any) {
            console.error(`[Careers Adapter] Failed to fetch for ${company.name}: ${err.message}`);
          }
        })
      );

      // Short delay between batches
      if (i + BATCH_SIZE < companies.length) {
        await sleep(150);
      }
    }

    console.log(
      `[Careers Adapter] Total matched jobs for skill "${skill}": ${allJobs.length}`
    );

    return allJobs;
  }

  mapToUnified(raw: any): UnifiedJob {
    const title = (raw.title || "").trim();
    const company = (raw.company || "").trim();
    const location = (raw.location || "Remote").trim();

    // Deduplication hash
    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto
      .createHash("sha256")
      .update(rawHashInput)
      .digest("hex");

    const description = `${title} at ${company}. Location: ${location}. Matched skill: ${raw._skill || ""}`;
    const extractedSkills = extractSkills(title + " " + description).map((s) =>
      s.name.toLowerCase()
    );

    // Always include the matched skill
    if (raw._skill && !extractedSkills.includes(raw._skill.toLowerCase())) {
      extractedSkills.push(raw._skill.toLowerCase());
    }

    const isRemote =
      location.toLowerCase().includes("remote") ||
      location.toLowerCase().includes("anywhere") ||
      location.toLowerCase().includes("work from home");

    // Experience level heuristics from title
    let experienceLevel: "entry" | "mid" | "senior" | "lead" | null = null;
    const titleLower = title.toLowerCase();
    if (titleLower.includes("senior") || titleLower.includes("sr.") || titleLower.includes("sr "))
      experienceLevel = "senior";
    else if (titleLower.includes("lead") || titleLower.includes("principal") || titleLower.includes("staff"))
      experienceLevel = "lead";
    else if (
      titleLower.includes("junior") ||
      titleLower.includes("jr.") ||
      titleLower.includes("intern") ||
      titleLower.includes("entry")
    )
      experienceLevel = "entry";
    else experienceLevel = "mid";

    // Job type heuristics
    let jobType:
      | "full-time"
      | "part-time"
      | "contract"
      | "internship"
      | "freelance"
      | null = "full-time";
    
    const rawType = String(raw.jobType || "").toLowerCase();
    if (titleLower.includes("intern") || rawType.includes("intern")) {
      jobType = "internship";
    } else if (titleLower.includes("contract") || rawType.includes("contract") || rawType.includes("temporary")) {
      jobType = "contract";
    } else if (titleLower.includes("part-time") || titleLower.includes("part time") || rawType.includes("part")) {
      jobType = "part-time";
    }

    let postedAtDate = new Date();
    if (raw.postedAt) {
      const parsed = new Date(raw.postedAt);
      if (!isNaN(parsed.getTime())) {
        postedAtDate = parsed;
      }
    }

    return {
      sourceId: dedupeHash.substring(0, 12),
      source: this.source,
      sourceUrl: raw.url || "",
      applyUrl: raw.url || null,
      title,
      company,
      companyLogoUrl: null,
      location,
      city: location.split(",")[0]?.trim() || null,
      country: location.split(",").pop()?.trim() || null,
      isRemote,
      jobType,
      experienceLevel,
      skills: extractedSkills,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryPeriod: null,
      description,
      descriptionHtml: `<p>${description}</p>`,
      postedAt: postedAtDate,
      expiresAt: null,
      fetchedAt: new Date(),
      dedupeHash,
    };
  }
}
