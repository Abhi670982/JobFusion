import crypto from "crypto";
import { connectDB } from "./mongodb";
import Job from "../models/Job";
import FetchLog from "../models/FetchLog";
import FailedJob from "../models/FailedJob";
import { JobSource, UnifiedJob } from "./adapters/types";
import { WellfoundAdapter } from "./adapters/wellfound";
import { CareersAdapter } from "./adapters/careers";
import { AggregatorAdapter } from "./adapters/aggregator";
import { extractSkillsFromDB } from "./skills";
import { parsePostedDate } from "./parse-posted-date";

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
    case "wellfound":
      return "#0a85ea";
    case "careers":
      return "#14b8a6";
    case "aggregator":
      return "#ec4899";
    default:
      return "#6366f1";
  }
}

// Convert a Date to a human-readable relative string like "2 hours ago"
export function toRelativeTimeString(date: Date | null | undefined): string {
  if (!date) return "Just now";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
}

// Fetch and process jobs for a specific source
export async function runSourceSync(source: JobSource, keywords: string[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await connectDB();
    console.log(`[Pipeline] Starting sync for source: ${source}`);

    let adapter;
    switch (source) {
      case "wellfound":
        adapter = new WellfoundAdapter();
        break;
      case "careers":
        adapter = new CareersAdapter();
        break;
      case "aggregator":
        adapter = new AggregatorAdapter();
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

    // RULE 2: Skills from DB are the ONLY source of keywords (unless empty, fallback to input keywords)
    const dbSkills = await extractSkillsFromDB().catch(err => {
      console.warn(`[Pipeline] extractSkillsFromDB failed:`, err.message);
      return [];
    });

    const activeKeywords = dbSkills.length > 0 ? dbSkills : keywords;

    const filteredKeywords = activeKeywords
      .map(k => k.trim())
      .filter(k => k.length > 0 && !genericSkills.has(k.toLowerCase()));

    const keywordsToSearch = filteredKeywords.length > 0 
      ? filteredKeywords.slice(0, 10) // 10 skills max
      : activeKeywords.slice(0, 5);

    console.log(`[Pipeline] Keywords selected for ${source} sync:`, keywordsToSearch);

    let allRawJobs: any[] = [];
    for (const keyword of keywordsToSearch) {
      try {
        console.log(`[Pipeline] Fetching jobs from ${source} for keyword: "${keyword}"`);
        const rawJobs = await adapter.fetchJobs({ keywords: [keyword], location: "India", page: 1 });
        console.log(`[Pipeline] Got ${rawJobs.length} raw jobs for "${keyword}" from ${source}`);
        
        // Tag jobs with the matched skill keyword
        const taggedJobs = rawJobs.map((rj: any) => ({ ...rj, _matchedSkill: keyword }));
        allRawJobs.push(...taggedJobs);
      } catch (err: any) {
        console.error(`[Pipeline] Fetch failed for ${source} keyword "${keyword}":`, err.message);
      }
      // Delay between skills — be polite to target servers (2.5s)
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }

    console.log(`[Pipeline] Total aggregated raw jobs from ${source} for all keywords: ${allRawJobs.length}`);

    let successCount = 0;
    let jobsAdded = 0;
    let jobsUpdated = 0;
    let rejectedNoDate = 0;
    let rejectedTooOld = 0;
    let rejectedNoSkill = 0;
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;

    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    for (const raw of allRawJobs) {
      try {
        // Map and normalize
        const unified = adapter.mapToUnified(raw);
        const matchedSkill = raw._matchedSkill || null;

        // RULE 1: Discard jobs missing posted date
        if (!unified.postedAt) {
          rejectedNoDate++;
          continue;
        }

        // RULE 1: Only jobs posted within 24 hours are stored
        const jobDate = new Date(unified.postedAt);
        const ageMs = Date.now() - jobDate.getTime();
        if (ageMs > TWENTY_FOUR_HOURS_MS) {
          rejectedTooOld++;
          continue;
        }

        // RULE 2: Matched skill verification
        if (!matchedSkill) {
          rejectedNoSkill++;
          continue;
        }

        // Update oldest/newest date trackers
        if (!oldestDate || jobDate < oldestDate) oldestDate = jobDate;
        if (!newestDate || jobDate > newestDate) newestDate = jobDate;

        // Deduplication Logic
        const existingJob = await Job.findOne({ dedupeHash: unified.dedupeHash });

        if (existingJob) {
          // Update fetched timestamp and source urls if source is new
          existingJob.fetchedAt = new Date();
          existingJob.applyUrl = unified.applyUrl || existingJob.applyUrl;
          existingJob.sourceUrl = unified.sourceUrl || existingJob.sourceUrl;
          existingJob.postedAtDate = jobDate;
          existingJob.postedAt = toRelativeTimeString(jobDate);
          existingJob.matchedSkill = matchedSkill;
          existingJob.expiresAt = new Date(Date.now() + TWENTY_FOUR_HOURS_MS); // TTL index deletion target
          existingJob.isActive = true;
          await existingJob.save();
          jobsUpdated++;
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
            postedAt: toRelativeTimeString(jobDate),
            postedAtDate: jobDate,
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
            expiresAt: new Date(Date.now() + TWENTY_FOUR_HOURS_MS), // TTL index deletion target
            fetchedAt: unified.fetchedAt,
            dedupeHash: unified.dedupeHash,
            category: "Engineering",
            featured: Math.random() > 0.85, // Make some jobs featured randomly
            matchedSkill: matchedSkill,
            isActive: true
          });
          jobsAdded++;
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

    // Hard-expire any job older than 24 hours in the DB for this source
    const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);
    const expired = await Job.updateMany(
      {
        source: source,
        postedAtDate: { $lt: cutoff },
        isActive: true,
      },
      { $set: { isActive: false } }
    );

    console.log(`[Pipeline] Expired ${expired.modifiedCount} jobs older than 24 hours for ${source}`);

    // Log success
    await FetchLog.create({
      source,
      status: "success",
      jobsFetched: successCount,
      jobsAdded,
      jobsUpdated,
      jobsExpired: expired.modifiedCount,
      skillsUsed: keywordsToSearch,
      jobsRejected: {
        noDate: rejectedNoDate,
        tooOld: rejectedTooOld,
        noSkillMatch: rejectedNoSkill,
      },
      oldestJobStored: oldestDate,
      newestJobStored: newestDate,
      crawledAt: new Date(),
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
