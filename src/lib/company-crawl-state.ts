import { prisma } from "./prisma";
import { CrawlStatus } from "@prisma/client";

/**
 * Persistent Company Crawl Health & Backoff State Manager
 * Uses PostgreSQL `companies` table to survive worker process restarts.
 */

const BACKOFF_WINDOW_MS = 30 * 60 * 1000; // 30 minutes backoff after failure

export async function isCompanyInBackoff(companyName: string): Promise<boolean> {
  try {
    const record = await prisma.company.findUnique({
      where: { name: companyName },
    });

    if (!record || record.crawlStatus !== CrawlStatus.failed || !record.updatedAt) {
      return false;
    }

    const timeSinceErrorMs = Date.now() - record.updatedAt.getTime();
    if (timeSinceErrorMs < BACKOFF_WINDOW_MS) {
      console.log(`[Crawl Health] Skipping ${companyName}: in 30-min failure backoff window (${Math.round(timeSinceErrorMs / 60000)}m elapsed).`);
      return true;
    }

    return false;
  } catch (err: any) {
    console.error(`[Crawl Health] Error checking backoff for ${companyName}:`, err?.message);
    return false;
  }
}

export async function recordCompanyCrawlSuccess(companyName: string, jobsFound: number, careersUrl: string): Promise<void> {
  try {
    await prisma.company.upsert({
      where: { name: companyName },
      update: {
        lastSync: new Date(),
        jobsFound,
        crawlStatus: CrawlStatus.idle,
        lastError: null,
        isEnabled: true,
      },
      create: {
        name: companyName,
        careerUrl: careersUrl || `https://careers.${companyName.toLowerCase().replace(/\s+/g, "")}.com`,
        crawlStatus: CrawlStatus.idle,
        lastSync: new Date(),
        jobsFound,
        lastError: null,
        isEnabled: true,
      },
    });
  } catch (err: any) {
    console.error(`[Crawl Health] Failed recording success for ${companyName}:`, err?.message);
  }
}

export async function recordCompanyCrawlFailure(companyName: string, errorMessage: string, careersUrl: string): Promise<void> {
  try {
    await prisma.company.upsert({
      where: { name: companyName },
      update: {
        crawlStatus: CrawlStatus.failed,
        lastError: errorMessage.substring(0, 250),
        isEnabled: true,
      },
      create: {
        name: companyName,
        careerUrl: careersUrl || `https://careers.${companyName.toLowerCase().replace(/\s+/g, "")}.com`,
        crawlStatus: CrawlStatus.failed,
        lastSync: null,
        jobsFound: 0,
        lastError: errorMessage.substring(0, 250),
        isEnabled: true,
      },
    });
  } catch (err: any) {
    console.error(`[Crawl Health] Failed recording failure for ${companyName}:`, err?.message);
  }
}
