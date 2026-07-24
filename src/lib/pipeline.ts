import { prisma } from "./prisma";
import { JobSourceCategory } from "@prisma/client";
import { classifySourceCategory } from "./source-category";
import { JobSource } from "./adapters/types";
import { WellfoundAdapter } from "./adapters/wellfound";
import { CareersAdapter } from "./adapters/careers";
import { AggregatorAdapter } from "./adapters/aggregator";
import { extractSkillsFromDB } from "./skills";
import { calculateRelevanceScore } from "./relevance";


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
  if (!date) return "Recently listed";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? "s" : ""} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
}

export const DEFAULT_RESULT_TARGET = 20;
export const MAX_RESULT_TARGET = 50;
export const MAX_AGE_HOURS = 168; // 7 days (168h)

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

/**
 * Progressively queries active DB jobs matching user skills across 24h buckets (up to 7 days = 168h).
 * Decoupled from crawling: stops as soon as targetLimit (default 20, max 50) unique relevant jobs are found.
 */
export async function queryUserJobs(
  skills: string[],
  sourceFilter: string = "careers",
  targetLimit: number = DEFAULT_RESULT_TARGET
): Promise<{ jobs: any[]; totalFound: number; expandedBuckets: number }> {
  const limit = Math.min(Math.max(1, targetLimit), MAX_RESULT_TARGET);
  const now = new Date();
  const lowerSkills = skills.map(s => s.toLowerCase().trim()).filter(Boolean);

  const matchedJobMap = new Map<string, any>();
  let expandedBuckets = 0;

  for (let day = 0; day < 7; day++) {
    expandedBuckets = day + 1;
    const bucketStart = new Date(now.getTime() - (day + 1) * 24 * 60 * 60 * 1000);
    const bucketEnd = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);

    const bucketJobs = await prisma.job.findMany({
      where: {
        source: sourceFilter,
        isActive: true,
        postedAtDate: {
          gte: bucketStart,
          lt: bucketEnd
        },
        ...(lowerSkills.length > 0 ? {
          skills: {
            hasSome: lowerSkills
          }
        } : {})
      },
      orderBy: { postedAtDate: "desc" },
      take: limit * 2
    });

    for (const j of bucketJobs) {
      if (!matchedJobMap.has(j.id)) {
        matchedJobMap.set(j.id, j);
      }
    }

    if (matchedJobMap.size >= limit) {
      break;
    }
  }

  const finalJobs = Array.from(matchedJobMap.values()).slice(0, limit);
  return {
    jobs: finalJobs,
    totalFound: finalJobs.length,
    expandedBuckets
  };
}

// Fetch and process jobs for a specific source
export async function runSourceSync(
  source: JobSource,
  keywords: string[]
): Promise<{ success: boolean; count: number; addedJobs?: number; updatedJobs?: number; skippedJobs?: number; newJobs?: any[]; error?: string }> {
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

    const genericSkills = new Set([
      "git",
      "github",
      "gitlab",
      "bitbucket",
      "html",
      "html5",
      "css",
      "css3",
      "agile",
      "scrum",
      "kanban",
      "jira",
      "communication",
      "teamwork",
      "rest api",
      "rest apis",
      "restful api",
      "restful apis",
      "websockets",
      "websocket",
      "unit testing",
      "jest",
      "mocha",
      "chai",
      "cypress",
      "figma",
      "ui/ux design",
      "user interface",
      "user experience",
      "product design",
    ]);

    // RULE 2: Skills from DB are preferred; fall back to provided keywords
    const dbSkills = await extractSkillsFromDB().catch((err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : "Extract skills failed";
      console.warn(`[Pipeline] extractSkillsFromDB failed:`, errorMessage);
      return [] as string[];
    });

    const activeKeywords = dbSkills.length > 0 ? dbSkills : keywords;

    const filteredKeywords = activeKeywords
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && !genericSkills.has(k.toLowerCase()));

    const keywordsToSearch =
      filteredKeywords.length > 0
        ? filteredKeywords.slice(0, 10)
        : activeKeywords.slice(0, 5);

    console.log(`[Pipeline] Keywords selected for ${source} sync:`, keywordsToSearch);

    let successCount = 0;
    let jobsAdded = 0;
    let jobsUpdated = 0;
    let rejectedNoDate = 0;
    let rejectedTooOld = 0;
    let rejectedNoSkill = 0;
    const newJobsList: any[] = [];

    if (source === "careers") {
      let allRawJobs: any[] = [];
      try {
        console.log(`[Pipeline] Executing ONE single shared board acquisition for ${source}...`);
        allRawJobs = await adapter.fetchJobs({
          keywords: keywordsToSearch,
          location: "India",
          page: 1,
        });
      } catch (err: any) {
        console.error(`[Pipeline] Fetch failed for ${source}:`, err.message);
      }

      console.log(`[Pipeline] Total raw careers jobs acquired in single pass: ${allRawJobs.length}`);

      // Normalize all fetched jobs in memory
      const mappedJobs = allRawJobs.map(raw => {
        try {
          const unified = adapter.mapToUnified(raw);
          return { raw, unified };
        } catch (err: any) {
          console.error(`[Pipeline] Mapping failed for raw career job:`, err.message);
          return null;
        }
      }).filter(Boolean) as { raw: any; unified: any }[];

      // Progressive loop over 7 daily windows
      const requestNow = new Date();
      const relevantJobKeys = new Set<string>();

      for (let day = 0; day < 7; day++) {
        const crawlFrom = new Date(requestNow.getTime() - (day + 1) * 24 * 60 * 60 * 1000);
        const crawlTo = new Date(requestNow.getTime() - day * 24 * 60 * 60 * 1000);

        // Filter jobs belonging to this day's window (or un-dated jobs processed in Day 1)
        const dailyJobs = mappedJobs.filter(item => {
          let jobDate = item.unified.postedAt ? new Date(item.unified.postedAt) : null;
          if (!jobDate || isNaN(jobDate.getTime())) {
            return day === 0;
          }
          return jobDate >= crawlFrom && jobDate < crawlTo;
        });

        console.log(`[Pipeline] Careers processing - Day ${day + 1}: ${crawlFrom.toISOString()} to ${crawlTo.toISOString()} -> found ${dailyJobs.length} jobs`);

        for (const item of dailyJobs) {
          try {
            const { raw, unified } = item;

            if (!unified.dedupeHash) {
              throw new Error("Missing dedupeHash from adapter mapping");
            }

            const hasValidPostedAt = Boolean(unified.postedAt && !isNaN(new Date(unified.postedAt).getTime()));
            const jobDate: Date | null = hasValidPostedAt ? new Date(unified.postedAt!) : null;

            if (jobDate && (Date.now() - jobDate.getTime() > TEN_DAYS_MS)) {
              rejectedTooOld++;
              continue;
            }

            const calculatedScore = calculateRelevanceScore(
              {
                title: unified.title,
                skills: unified.skills,
                description: unified.description,
                requirements: unified.requirements,
              },
              keywordsToSearch
            );

            const matchedSkill = unified.skills?.[0] || keywordsToSearch[0] || "Software Engineer";

            const classified = classifySourceCategory(source);

            try {
              const existingJob = await prisma.job.findUnique({
                where: { dedupeHash: unified.dedupeHash },
              });

              if (existingJob) {
                await prisma.job.update({
                  where: { id: existingJob.id },
                  data: {
                    fetchedAt: new Date(),
                    applyUrl: unified.applyUrl || existingJob.applyUrl,
                    sourceUrl: unified.sourceUrl || existingJob.sourceUrl,
                    sourceCategory: classified.category,
                    sourceProvider: classified.provider,
                    postedAtDate: jobDate || existingJob.postedAtDate,
                    postedAt: toRelativeTimeString(jobDate || existingJob.postedAtDate),
                    matchScore: calculatedScore,
                    matchedSkill,
                    isActive: true,
                  },
                });
                jobsUpdated++;
                console.log(
                  `[Pipeline] Updated existing job: ${unified.title} at ${unified.company} (${source})`
                );
              } else {
                const experienceString =
                  unified.experienceLevel === "entry"
                    ? "Entry Level"
                    : unified.experienceLevel === "senior"
                      ? "Senior (5+ yrs)"
                      : unified.experienceLevel === "lead"
                        ? "Lead / Principal"
                        : "Mid Level";

                const salaryString =
                  unified.salaryMin && unified.salaryMax
                    ? `₹${Math.round(unified.salaryMin / 100000)}L – ₹${Math.round(unified.salaryMax / 100000)}L`
                    : "Not disclosed";

                let pgType = "full_time";
                if (unified.jobType === "full-time") pgType = "full_time";
                else if (unified.jobType === "part-time") pgType = "part_time";
                else if (
                  ["contract", "internship", "freelance"].includes(unified.jobType || "")
                ) {
                  pgType = unified.jobType || "full_time";
                }

                const newJob = await prisma.job.create({
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
                    matchScore: calculatedScore,
                    postedAt: toRelativeTimeString(jobDate),
                    postedAtDate: jobDate || new Date(),
                    description: unified.description,
                    descriptionHtml: unified.descriptionHtml,
                    source: source,
                    sourceCategory: classified.category,
                    sourceProvider: classified.provider,
                    sourceId: unified.sourceId,
                    sourceUrl: unified.sourceUrl,
                    applyUrl: unified.applyUrl,
                    city: unified.city,
                    country: unified.country,
                    isRemote: unified.isRemote,
                    salaryCurrency: unified.salaryCurrency,
                    salaryPeriod: unified.salaryPeriod,
                    fetchedAt: unified.fetchedAt || new Date(),
                    dedupeHash: unified.dedupeHash,
                    category: "Engineering",
                    featured: false,
                    matchedSkill,
                    isActive: true,
                  },
                });
                newJobsList.push(newJob);
                jobsAdded++;
                console.log(
                  `[Pipeline] Inserted new job: ${unified.title} at ${unified.company} (${source})`
                );
              }
            } catch (dbErr: any) {
              if (dbErr.code === "P2002") {
                console.log(`[Pipeline Duplicate Race Suppressed] Job with hash ${unified.dedupeHash} was inserted concurrently.`);
              } else {
                throw dbErr;
              }
            }

            successCount++;
            relevantJobKeys.add(unified.dedupeHash);
          } catch (err: any) {
            console.error(`[Pipeline] Job processing failed for careers in window:`, err.message);
          }

        }

        console.log(`[Pipeline] Day ${day + 1} progressive evaluation: processed ${dailyJobs.length} jobs. Total accumulated relevant set size: ${relevantJobKeys.size}`);
      }
    } else {
      const allRawJobs: any[] = [];
      for (const keyword of keywordsToSearch) {
        try {
          console.log(`[Pipeline] Fetching jobs from ${source} for keyword: "${keyword}"`);
          const rawJobs = await adapter.fetchJobs({
            keywords: [keyword],
            location: "India",
            page: 1,
          });
          console.log(
            `[Pipeline] Got ${rawJobs.length} raw jobs for "${keyword}" from ${source}`
          );

          const taggedJobs = rawJobs.map((rj: any) => ({
            ...rj,
            _matchedSkill: keyword.toLowerCase(),
          }));
          allRawJobs.push(...taggedJobs);
        } catch (err: any) {
          console.error(
            `[Pipeline] Fetch failed for ${source} keyword "${keyword}":`,
            err.message
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }

      console.log(
        `[Pipeline] Total aggregated raw jobs from ${source} for all keywords: ${allRawJobs.length}`
      );

      for (const raw of allRawJobs) {
        try {
          const unified = adapter.mapToUnified(raw);
          const matchedSkill: string | null = raw._matchedSkill || null;

          if (!unified.dedupeHash) {
            throw new Error("Missing dedupeHash from adapter mapping");
          }

          // RULE 1: Parse the posted date; fall back to now if unparseable so the job still enters DB
          let jobDate = unified.postedAt ? new Date(unified.postedAt) : null;
          if (!jobDate || isNaN(jobDate.getTime())) {
            // If we can't parse the date, use the current time as a conservative fallback
            // (job will appear as "just now" which is better than being silently dropped)
            jobDate = new Date();
          }
          const ageMs = Date.now() - jobDate.getTime();
          if (ageMs > TEN_DAYS_MS) {
            rejectedTooOld++;
            continue;
          }

          // RULE 2: Matched skill verification
          if (!matchedSkill) {
            rejectedNoSkill++;
            continue;
          }

          const existingJob = await prisma.job.findUnique({
            where: { dedupeHash: unified.dedupeHash },
          });

          if (existingJob) {
            await prisma.job.update({
              where: { id: existingJob.id },
              data: {
                fetchedAt: new Date(),
                applyUrl: unified.applyUrl || existingJob.applyUrl,
                sourceUrl: unified.sourceUrl || existingJob.sourceUrl,
                postedAtDate: jobDate,
                postedAt: toRelativeTimeString(jobDate),
                matchedSkill,
                expiresAt: new Date(Date.now() + TEN_DAYS_MS),
                isActive: true,
              },
            });
            jobsUpdated++;
            console.log(
              `[Pipeline] Updated existing job: ${unified.title} at ${unified.company} (${source})`
            );
          } else {
            const experienceString =
              unified.experienceLevel === "entry"
                ? "Entry Level"
                : unified.experienceLevel === "senior"
                  ? "Senior (5+ yrs)"
                  : unified.experienceLevel === "lead"
                    ? "Lead / Principal"
                    : "Mid Level";

            const salaryString =
              unified.salaryMin && unified.salaryMax
                ? `₹${Math.round(unified.salaryMin / 100000)}L – ₹${Math.round(unified.salaryMax / 100000)}L`
                : "Not disclosed";

            let pgType = "full_time";
            if (unified.jobType === "full-time") pgType = "full_time";
            else if (unified.jobType === "part-time") pgType = "part_time";
            else if (
              ["contract", "internship", "freelance"].includes(unified.jobType || "")
            ) {
              pgType = unified.jobType || "full_time";
            }

            const newJob = await prisma.job.create({
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
                matchScore: 70 + Math.floor(Math.random() * 25),
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
                expiresAt: new Date(Date.now() + TEN_DAYS_MS),
                fetchedAt: unified.fetchedAt || new Date(),
                dedupeHash: unified.dedupeHash,
                category: "Engineering",
                featured: Math.random() > 0.85,
                matchedSkill,
                isActive: true,
              },
            });
            newJobsList.push(newJob);
            jobsAdded++;
            console.log(
              `[Pipeline] Inserted new job: ${unified.title} at ${unified.company} (${source})`
            );
          }

          successCount++;
        } catch (err: any) {
          console.error(
            `[Pipeline] Job normalization failed for ${source}:`,
            err.message
          );
          try {
            await prisma.failedJob.create({
              data: {
                source,
                rawPayload: raw || {},
                errorMsg: err.message || "Failed to normalize job payload",
              },
            });
          } catch (pgErr) {
            console.error("Error creating FailedJob in PG:", pgErr);
          }
        }
      }
    }

    // DB Retention Cleanup: Soft-deactivate jobs older than 60 days for this source
    // Note: 7-day feed visibility is strictly enforced by API query filters (postedAtDate >= now - 168h)
    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
    const retentionCutoff = new Date(Date.now() - SIXTY_DAYS_MS);
    try {
      const expired = await prisma.job.updateMany({
        where: {
          source,
          postedAtDate: { lt: retentionCutoff },
          isActive: true,
        },
        data: { isActive: false },
      });
      console.log(
        `[Pipeline] Soft-deactivated ${expired.count} jobs older than 60-day DB retention cutoff for ${source}`
      );
    } catch (pgErr) {
      console.error("Error updating retention jobs in PG:", pgErr);
    }

    try {
      await prisma.fetchLog.create({
        data: {
          source,
          status: "success",
          jobsFetched: successCount,
          errorMsg: JSON.stringify({
            jobsAdded,
            jobsUpdated,
            rejectedNoDate,
            rejectedTooOld,
            rejectedNoSkill,
            skillsUsed: keywordsToSearch,
          }),
        },
      });
    } catch (pgErr) {
      console.error("Error logging success in PG:", pgErr);
    }

    return { 
      success: true, 
      count: successCount,
      addedJobs: jobsAdded,
      updatedJobs: jobsUpdated,
      skippedJobs: rejectedNoDate + rejectedTooOld + rejectedNoSkill,
      newJobs: newJobsList
    };
  } catch (error: any) {
    console.error(`[Pipeline] Fatal error syncing ${source}:`, error.message);

    const fetchStatus = error.message?.includes("CAPTCHA") ? "captcha" : "failed";
    try {
      await prisma.fetchLog.create({
        data: {
          source,
          status: fetchStatus as any,
          jobsFetched: 0,
          errorMsg: error.message || "Unknown pipeline error",
        },
      });
    } catch (pgErr) {
      console.error("Error logging fetch failure in PG:", pgErr);
    }

    return { success: false, count: 0, addedJobs: 0, updatedJobs: 0, skippedJobs: 0, newJobs: [], error: error.message };
  }
}
