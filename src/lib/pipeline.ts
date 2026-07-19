import crypto from "crypto";
import { prisma } from "./prisma";
import { JobSource, UnifiedJob } from "./adapters/types";
import { WellfoundAdapter } from "./adapters/wellfound";
import { CareersAdapter } from "./adapters/careers";
import { AggregatorAdapter } from "./adapters/aggregator";

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

        if (!unified.dedupeHash) {
          throw new Error("Missing dedupeHash from adapter mapping");
        }

        // Deduplication Logic - check Postgres
        const existingJob = await prisma.job.findUnique({
          where: { dedupeHash: unified.dedupeHash }
        });

        if (existingJob) {
          // Update in Postgres
          const updatedDate = unified.postedAt || existingJob.postedAtDate || new Date();
          const updatedJob = await prisma.job.update({
            where: { id: existingJob.id },
            data: {
              fetchedAt: new Date(),
              applyUrl: unified.applyUrl || existingJob.applyUrl,
              sourceUrl: unified.sourceUrl || existingJob.sourceUrl,
              postedAtDate: updatedDate,
              postedAt: toRelativeTimeString(updatedDate instanceof Date ? updatedDate : new Date(updatedDate))
            }
          });

          console.log(`[Pipeline] Updated existing job: ${unified.title} at ${unified.company} (${source})`);
        } else {
          // Format compatible fields
          const experienceString = unified.experienceLevel === "entry" ? "Entry Level" :
                                   unified.experienceLevel === "senior" ? "Senior (5+ yrs)" :
                                   unified.experienceLevel === "lead" ? "Lead / Principal" : "Mid Level";

          const salaryString = unified.salaryMin && unified.salaryMax
            ? `₹${Math.round(unified.salaryMin / 100000)}L – ₹${Math.round(unified.salaryMax / 100000)}L`
            : "Not disclosed";

          // Map enum JobType
          let pgType = "full_time";
          if (unified.jobType === "full-time") pgType = "full_time";
          else if (unified.jobType === "part-time") pgType = "part_time";
          else if (["contract", "internship", "freelance"].includes(unified.jobType || "")) {
            pgType = unified.jobType || "full_time";
          }

          // Create in Postgres
          const createdJob = await prisma.job.create({
            data: {
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
              experienceLevel: (unified.experienceLevel || "mid") as any,
              type: pgType as any,
              jobType: unified.jobType,
              skills: unified.skills,
              matchScore: 70 + Math.floor(Math.random() * 25), // Random Match Score for AI feature
              postedAt: toRelativeTimeString(unified.postedAt),
              postedAtDate: unified.postedAt || new Date(),
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
              featured: Math.random() > 0.85
            }
          });

          console.log(`[Pipeline] Inserted new job: ${unified.title} at ${unified.company} (${source})`);
        }

        successCount++;
      } catch (err: any) {
        console.error(`[Pipeline] Job normalization failed for ${source}:`, err.message);
        
        // Log to FailedJob in Postgres
        try {
          await prisma.failedJob.create({
            data: {
              source,
              rawPayload: raw || {},
              errorMsg: err.message || "Failed to normalize job payload",
            }
          });
        } catch (pgErr) {
          console.error("Error creating FailedJob in PG:", pgErr);
        }
      }
    }

    // Log success in Postgres
    try {
      await prisma.fetchLog.create({
        data: {
          source,
          status: "success",
          jobsFetched: successCount
        }
      });
    } catch (pgErr) {
      console.error("Error logging success in PG:", pgErr);
    }

    // Mark jobs from this source not seen in 12h as inactive in Postgres
    if (source === "careers" || source === "aggregator") {
      const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
      try {
        await prisma.job.updateMany({
          where: {
            source,
            fetchedAt: { lt: cutoff },
            isActive: true
          },
          data: {
            isActive: false
          }
        });
      } catch (pgErr) {
        console.error("Error marking inactive jobs in PG:", pgErr);
      }
    }

    return { success: true, count: successCount };
  } catch (error: any) {
    console.error(`[Pipeline] Fatal error syncing ${source}:`, error.message);
    
    // Log failure in Postgres
    const fetchStatus = error.message?.includes("CAPTCHA") ? "captcha" : "failed";
    try {
      await prisma.fetchLog.create({
        data: {
          source,
          status: fetchStatus as any,
          jobsFetched: 0,
          errorMsg: error.message || "Unknown pipeline error"
        }
      });
    } catch (pgErr) {
      console.error("Error logging fetch failure in PG:", pgErr);
    }

    return { success: false, count: 0, error: error.message };
  }
}
