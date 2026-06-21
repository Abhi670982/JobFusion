import { SourceAdapter, FetchQuery, UnifiedJob } from "./types";
import { extractSkills, PREDEFINED_SKILLS } from "@/lib/skills-extractor";
import { companies, CompanyCareerSite } from "@/lib/jobs/companySearchUrls";
import crypto from "crypto";
import * as cheerio from "cheerio";

// ── Job extraction from HTML ─────────────────────────────────────────────────

interface RawCareerJob {
  title: string;
  location: string;
  url: string;
  jobType?: string;
  postedAt?: string;
}

/**
 * Generic extractor that tries common career page patterns.
 * Most career pages use <a> tags with href containing /job, /careers, /opening, /position.
 */
function extractJobsFromHtml(html: string, company: CompanyCareerSite): RawCareerJob[] {
  const $ = cheerio.load(html);
  const jobs: RawCareerJob[] = [];

  const selectors = [
    "a[href*='/job']",
    "a[href*='/careers']",
    "a[href*='/opening']",
    "a[href*='/position']",
    "a[href*='/role']",
    "[class*='job'] a",
    "[class*='career'] a",
    "[class*='position'] a",
    "[class*='opening'] a",
    "[class*='role'] a",
    "li[class*='job'] a",
    "li[class*='role'] a",
    "[data-testid*='job'] a",
    "[data-testid*='role'] a",
  ];

  const seen = new Set<string>();

  for (const sel of selectors) {
    $(sel).each((_, el) => {
      const href = $(el).attr("href") || "";
      if (!href || seen.has(href)) return;
      seen.add(href);

      const title = $(el).text().trim().replace(/\s+/g, " ");
      if (!title || title.length < 3 || title.length > 150) return;

      // Skip navigation links, social links, generic "learn more" etc.
      const lower = title.toLowerCase();
      if (
        lower.includes("sign in") ||
        lower.includes("log in") ||
        lower.includes("learn more") ||
        lower.includes("cookie") ||
        lower.includes("privacy") ||
        lower.includes("terms")
      ) {
        return;
      }

      // Resolve relative URLs
      let url = href;
      if (href.startsWith("/")) {
        url = `${company.baseUrl}${href}`;
      } else if (!href.startsWith("http")) {
        url = `${company.baseUrl}/${href}`;
      }

      // Try to find location near the link
      const parent = $(el).closest("li, div, tr, article, section");
      const location =
        parent
          .find("[class*='location'], [class*='place'], [class*='city'], [class*='region']")
          .first()
          .text()
          .trim() || "Not specified";

      jobs.push({ title, location, url });
    });
  }

  return jobs;
}

// ── Static crawler (fetch + cheerio) ─────────────────────────────────────────

async function fetchStatic(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }

    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

// ── Dynamic crawler (puppeteer) ──────────────────────────────────────────────

async function fetchDynamic(url: string): Promise<string> {
  // Dynamic import to avoid loading puppeteer unless needed
  const puppeteerModule = await import("puppeteer");
  const puppeteer = puppeteerModule.default || puppeteerModule;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();

    // Block images, fonts, and media to speed up loading
    await page.setRequestInterception(true);
    page.on("request", (req: any) => {
      const resourceType = req.resourceType();
      if (["image", "font", "media", "stylesheet"].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 20000,
    });

    // Wait a bit for any JS rendering to finish
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const html = await page.content();
    return html;
  } finally {
    await browser.close();
  }
}

// ── Crawl URL dispatcher ─────────────────────────────────────────────────────

async function crawlUrl(
  url: string,
  type: "static" | "dynamic"
): Promise<string> {
  if (type === "dynamic") {
    try {
      return await fetchDynamic(url);
    } catch (err: any) {
      console.warn(`[Careers Adapter] Dynamic crawl failed for ${url} (${err.message}). Falling back to static fetch.`);
      return await fetchStatic(url);
    }
  }
  return fetchStatic(url);
}

// ── Sleep helper ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Random delay between 1.5s and 2.5s ──────────────────────────────────────

function randomDelay(): Promise<void> {
  const ms = 1500 + Math.floor(Math.random() * 1000);
  return sleep(ms);
}

interface CacheEntry {
  timestamp: number;
  data: any[];
}
const apiCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

// Fetch jobs from Greenhouse public JSON API
async function fetchGreenhouseJobs(boardName: string): Promise<any[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardName}/jobs`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Greenhouse API responded with HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.jobs)) return [];
  
  return data.jobs.map((job: any) => ({
    title: job.title,
    location: job.location?.name || "Remote",
    url: job.absolute_url,
    postedAt: job.updated_at,
  }));
}

// Fetch jobs from Lever public JSON API
async function fetchLeverJobs(companyName: string): Promise<any[]> {
  const url = `https://api.lever.co/v0/postings/${companyName}`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Lever API responded with HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data)) return [];
  
  return data.map((job: any) => ({
    title: job.text,
    location: job.categories?.location || "Remote",
    url: job.hostedUrl,
    postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
  }));
}

// Helper to check in-memory cache and fetch jobs if cache is missing/expired
async function getCachedApiJobs(companyName: string, fetchFn: () => Promise<any[]>): Promise<any[]> {
  const cached = apiCache.get(companyName);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[Careers Adapter] Cache HIT for ${companyName} (${cached.data.length} jobs)`);
    return cached.data;
  }
  
  console.log(`[Careers Adapter] Cache MISS for ${companyName}. Fetching from API...`);
  try {
    const data = await fetchFn();
    apiCache.set(companyName, { timestamp: now, data });
    return data;
  } catch (err: any) {
    console.warn(`[Careers Adapter] API fetch failed for ${companyName} (${err.message}). Returning empty array.`);
    return [];
  }
}

// Helper to match jobs with skills flexibly
function matchesSkill(title: string, skill: string): boolean {
  const tLower = title.toLowerCase();
  const sLower = skill.toLowerCase().trim();

  // 1. Direct substring match (e.g., "react" in "React Developer")
  if (tLower.includes(sLower)) return true;

  // 2. Specific case: "frontend developer" / "backend developer" / "fullstack developer"
  if (sLower.includes("frontend") || sLower.includes("front-end")) {
    return tLower.includes("frontend") || tLower.includes("front-end") || tLower.includes("ui");
  }
  if (sLower.includes("backend") || sLower.includes("back-end")) {
    return tLower.includes("backend") || tLower.includes("back-end");
  }
  if (sLower.includes("fullstack") || sLower.includes("full-stack") || sLower.includes("full stack")) {
    return tLower.includes("fullstack") || tLower.includes("full-stack") || tLower.includes("full stack");
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

// ── CareersAdapter ───────────────────────────────────────────────────────────

export class CareersAdapter implements SourceAdapter {
  source = "careers" as const;

  async fetchJobs(query: FetchQuery): Promise<any[]> {
    const skill = query.keywords[0] || "software engineer";
    const allJobs: any[] = [];

    console.log(
      `[Careers Adapter] Starting crawl for skill: "${skill}" across ${companies.length} companies`
    );

    for (const company of companies) {
      try {
        let rawJobs: any[] = [];

        if (company.apiType === "greenhouse") {
          rawJobs = await getCachedApiJobs(company.name, () => fetchGreenhouseJobs(company.apiIdentifier!));
        } else if (company.apiType === "lever") {
          rawJobs = await getCachedApiJobs(company.name, () => fetchLeverJobs(company.apiIdentifier!));
        } else {
          // HTML Scraper
          if (!company.searchUrl || !company.crawlerType) {
            console.warn(`[Careers Adapter] Skipping ${company.name} (no searchUrl or apiType configured)`);
            continue;
          }
          const url = company.searchUrl(skill);
          console.log(
            `[Careers Adapter] Crawling ${company.name} (${company.crawlerType}): ${url}`
          );

          const html = await crawlUrl(url, company.crawlerType);
          rawJobs = extractJobsFromHtml(html, company);

          // Respect rate limits for HTML scraper only
          await randomDelay();
        }

        console.log(
          `[Careers Adapter] Extracted ${rawJobs.length} raw jobs from ${company.name}`
        );

        // Only keep jobs where the title actually matches the skill
        const relevant = rawJobs.filter((job) =>
          matchesSkill(job.title, skill)
        );

        console.log(
          `[Careers Adapter] ${relevant.length} jobs matched skill "${skill}" at ${company.name}`
        );

        // Tag each job with company metadata
        for (const job of relevant) {
          allJobs.push({
            ...job,
            company: company.name,
            _isCareersCrawled: true,
            _skill: skill,
          });
        }

        // Skip if company returned 0 jobs (don't wipe existing data)
        if (rawJobs.length === 0) {
          console.log(
            `[Careers Adapter] ${company.name} returned 0 jobs — skipping`
          );
        }
      } catch (err: any) {
        console.error(
          `[Careers Adapter] Failed to crawl ${company.name}: ${err.message}`
        );
        // Continue to next company — one failure shouldn't stop the rest
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
    const location = (raw.location || "Not specified").trim();

    // Deduplication hash
    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto
      .createHash("sha256")
      .update(rawHashInput)
      .digest("hex");

    // Extract skills from the title (since we don't have full descriptions from career pages)
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
      location.toLowerCase().includes("anywhere");

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
    if (titleLower.includes("intern")) jobType = "internship";
    else if (titleLower.includes("contract")) jobType = "contract";
    else if (titleLower.includes("part-time") || titleLower.includes("part time"))
      jobType = "part-time";

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
      postedAt: new Date(),
      expiresAt: null,
      fetchedAt: new Date(),
      dedupeHash,
    };
  }
}
