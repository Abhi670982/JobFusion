import crypto from "crypto";
import { connectDB } from "./mongodb";
import Job from "../models/Job";
import FetchLog from "../models/FetchLog";
import FailedJob from "../models/FailedJob";
import { JobSource, UnifiedJob } from "./adapters/types";
import { LinkedInAdapter } from "./adapters/linkedin";
import { IndeedAdapter } from "./adapters/indeed";
import { WellfoundAdapter } from "./adapters/wellfound";
import { InternshalaAdapter } from "./adapters/internshala";

// Helper to clean HTML from descriptions
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Helper to determine company color
export function getCompanyColor(source: JobSource): string {
  switch (source) {
    case "linkedin":
      return "#0077b5";
    case "indeed":
      return "#6366f1";
    case "wellfound":
      return "#0a85ea";
    case "internshala":
      return "#f97316";
    default:
      return "#6366f1";
  }
}

// Fetch and process jobs for a specific source
export async function runSourceSync(source: JobSource, keywords: string[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await connectDB();
    console.log(`[Pipeline] Starting sync for source: ${source}`);

    let adapter;
    switch (source) {
      case "linkedin":
        adapter = new LinkedInAdapter();
        break;
      case "indeed":
        adapter = new IndeedAdapter();
        break;
      case "wellfound":
        adapter = new WellfoundAdapter();
        break;
      case "internshala":
        adapter = new InternshalaAdapter();
        break;
      default:
        throw new Error(`Unknown source: ${source}`);
    }

    // Filter and select top keywords to search
    const genericSkills = new Set([
      "git", "github", "gitlab", "bitbucket", "html", "html5", "css", "css3",
      "agile", "scrum", "kanban", "jira", "communication", "teamwork", "rest api",
      "rest apis", "restful api", "restful apis", "websockets", "websocket",
      "unit testing", "jest", "mocha", "chai", "cypress", "figma", "ui/ux design",
      "user interface", "user experience", "product design"
    ]);

    const filteredKeywords = keywords
      .map(k => k.trim())
      .filter(k => k.length > 0 && !genericSkills.has(k.toLowerCase()));

    const keywordsToSearch = filteredKeywords.length > 0 
      ? filteredKeywords.slice(0, 5)
      : keywords.slice(0, 5);

    console.log(`[Pipeline] Keywords selected for ${source} sync:`, keywordsToSearch);

    let allRawJobs: any[] = [];
    for (const keyword of keywordsToSearch) {
      try {
        console.log(`[Pipeline] Fetching jobs from ${source} for keyword: "${keyword}"`);
        const rawJobs = await adapter.fetchJobs({ keywords: [keyword], location: "India", page: 1 });
        console.log(`[Pipeline] Got ${rawJobs.length} raw jobs for "${keyword}" from ${source}`);
        allRawJobs.push(...rawJobs);
      } catch (err: any) {
        console.error(`[Pipeline] Fetch failed for ${source} keyword "${keyword}":`, err.message);
      }
      // Brief delay to prevent rate limiting / scraping blocks
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    console.log(`[Pipeline] Total aggregated raw jobs from ${source} for all keywords: ${allRawJobs.length}`);

    let successCount = 0;

    for (const raw of allRawJobs) {
      try {
        // Map and normalize
        const unified = adapter.mapToUnified(raw);

        // Deduplication Logic
        const existingJob = await Job.findOne({ dedupeHash: unified.dedupeHash });

        if (existingJob) {
          // Update fetched timestamp and source urls if source is new
          existingJob.fetchedAt = new Date();
          existingJob.applyUrl = unified.applyUrl || existingJob.applyUrl;
          existingJob.sourceUrl = unified.sourceUrl || existingJob.sourceUrl;
          await existingJob.save();
          console.log(`[Pipeline] Updated existing job: ${unified.title} at ${unified.company} (${source})`);
        } else {
          // Format compatible fields for frontend
          const experienceString = unified.experienceLevel === "entry" ? "Entry Level" :
                                   unified.experienceLevel === "senior" ? "Senior (5+ yrs)" :
                                   unified.experienceLevel === "lead" ? "Lead / Principal" : "Mid Level";

          const salaryString = unified.salaryMin && unified.salaryMax
            ? `₹${Math.round(unified.salaryMin / 100000)}L – ₹${Math.round(unified.salaryMax / 100000)}L`
            : "Not disclosed";

          // Create new Job
          await Job.create({
            title: unified.title,
            company: unified.company,
            companyLogo: unified.companyLogoUrl || unified.company.charAt(0),
            companyColor: getCompanyColor(source),
            location: unified.location || "Remote, India",
            locationType: unified.isRemote ? "remote" : "onsite",
            salary: salaryString,
            salaryMin: unified.salaryMin || 0,
            salaryMax: unified.salaryMax || 0,
            experience: experienceString,
            experienceLevel: unified.experienceLevel || "mid",
            type: unified.jobType || "full-time",
            jobType: unified.jobType,
            skills: unified.skills,
            matchScore: 70 + Math.floor(Math.random() * 25), // Random Match Score for AI feature
            postedAt: unified.postedAt || new Date(),
            description: unified.description,
            descriptionHtml: unified.descriptionHtml,
            source: source,
            sourceId: unified.sourceId,
            sourceUrl: unified.sourceUrl,
            applyUrl: unified.applyUrl,
            city: unified.city,
            country: unified.country,
            isRemote: unified.isRemote,
            salaryCurrency: unified.salaryCurrency,
            salaryPeriod: unified.salaryPeriod,
            expiresAt: unified.expiresAt,
            fetchedAt: unified.fetchedAt,
            dedupeHash: unified.dedupeHash,
            category: "Engineering",
            featured: Math.random() > 0.85 // Make some jobs featured randomly
          });
          console.log(`[Pipeline] Inserted new job: ${unified.title} at ${unified.company} (${source})`);
        }

        successCount++;
      } catch (err: any) {
        console.error(`[Pipeline] Job normalization failed for ${source}:`, err.message);
        // Log to failed_jobs table
        await FailedJob.create({
          source,
          rawPayload: raw,
          errorMsg: err.message || "Failed to normalize job payload",
        }).catch(dbErr => console.error("Error creating FailedJob record:", dbErr.message));
      }
    }

    // Log success
    await FetchLog.create({
      source,
      status: "success",
      jobsFetched: successCount,
    });

    return { success: true, count: successCount };
  } catch (error: any) {
    console.error(`[Pipeline] Fatal error syncing ${source}:`, error.message);
    
    // Log failure
    await FetchLog.create({
      source,
      status: error.message?.includes("CAPTCHA") ? "captcha" : "failed",
      jobsFetched: 0,
      errorMsg: error.message || "Unknown pipeline error",
    }).catch(dbErr => console.error("Error creating FetchLog record:", dbErr.message));

    return { success: false, count: 0, error: error.message };
  }
}
