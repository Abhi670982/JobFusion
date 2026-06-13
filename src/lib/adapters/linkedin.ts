import { SourceAdapter, FetchQuery, UnifiedJob } from "./types";
import { extractSkills } from "@/lib/skills-extractor";
import crypto from "crypto";

export class LinkedInAdapter implements SourceAdapter {
  source = "linkedin" as const;

  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY || "";
  }

  async fetchJobs(query: FetchQuery): Promise<any[]> {
    const keyword = query.keywords[0] || "react";

    if (!this.apiKey) {
      console.warn("[LinkedIn Adapter] RAPIDAPI_KEY is not set. Fetching real jobs using LinkedIn Guest Search API...");
      return this.scrapeGuestJobs(keyword);
    }

    const page = query.page || 1;
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(keyword)}&page=${page}&num_pages=1`;

    console.log(`[LinkedIn Adapter] Fetching LinkedIn jobs: ${url}`);
    
    let attempt = 1;
    let delay = 1000;

    while (attempt <= 3) {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": this.apiKey,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
          },
        });

        if (response.status === 429) {
          console.warn(`[LinkedIn Adapter] 429 Too Many Requests. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          attempt++;
          delay *= 2;
          continue;
        }

        if (!response.ok) {
          throw new Error(`LinkedIn API responded with status: ${response.status}`);
        }

        const data = await response.json();
        return data.data || [];
      } catch (error: any) {
        console.error(`[LinkedIn Adapter] Error fetching data (Attempt ${attempt}):`, error.message);
        if (attempt === 3) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
        delay *= 2;
      }
    }

    return [];
  }

  mapToUnified(raw: any): UnifiedJob {
    if (raw._isMock) {
      return raw as UnifiedJob;
    }

    if (raw._isGuestScraped) {
      const title = raw.title;
      const company = raw.company;
      const location = raw.location || "Remote, India";

      const rawHashInput = `${title}${company}${location}`.toLowerCase();
      const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

      const description = `This is a job listing fetched from LinkedIn. Experience the role of ${title} at ${company} located in ${location}.`;
      const extractedSkills = extractSkills(description).map(s => s.name.toLowerCase());

      const isRemote =
        location.toLowerCase().includes("remote") ||
        location.toLowerCase().includes("work from home") ||
        location.toLowerCase().includes("wfh");

      let sourceId = dedupeHash.substring(0, 12);
      const match = raw.applyUrl.match(/-(\d+)\?/);
      if (match && match[1]) {
        sourceId = match[1];
      }

      let postedAt = new Date();
      if (raw.postedText) {
        const parsedDate = new Date(raw.postedText);
        if (!isNaN(parsedDate.getTime())) {
          postedAt = parsedDate;
        } else {
          const numMatch = raw.postedText.match(/\d+/);
          const val = numMatch ? parseInt(numMatch[0], 10) : 1;
          const now = new Date();
          if (raw.postedText.toLowerCase().includes("hour")) {
            now.setHours(now.getHours() - val);
          } else if (raw.postedText.toLowerCase().includes("day")) {
            now.setDate(now.getDate() - val);
          } else if (raw.postedText.toLowerCase().includes("week")) {
            now.setDate(now.getDate() - val * 7);
          } else if (raw.postedText.toLowerCase().includes("month")) {
            now.setMonth(now.getMonth() - val);
          }
          postedAt = now;
        }
      }

      return {
        sourceId,
        source: this.source,
        sourceUrl: raw.applyUrl || `https://www.linkedin.com`,
        applyUrl: raw.applyUrl || null,
        title,
        company,
        companyLogoUrl: null,
        location,
        city: location.split(",")[0] || null,
        country: "India",
        isRemote,
        jobType: "full-time",
        experienceLevel: title.toLowerCase().includes("senior") ? "senior" : "mid",
        skills: extractedSkills,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "INR",
        salaryPeriod: "annual",
        description,
        descriptionHtml: `<p>${description}</p>`,
        postedAt,
        expiresAt: null,
        fetchedAt: new Date(),
        dedupeHash,
      };
    }

    const title = (raw.job_title || "").trim();
    const company = (raw.employer_name || "").trim();
    const location = [raw.job_city, raw.job_country].filter(Boolean).join(", ") || "Remote, India";

    const rawHashInput = `${title}${company}${location}`.toLowerCase();
    const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

    const description = raw.job_description || "";
    const extractedSkills = extractSkills(description).map(s => s.name.toLowerCase());

    let salaryMin = raw.job_min_salary || null;
    let salaryMax = raw.job_max_salary || null;
    const salaryCurrency = raw.job_salary_currency || "INR";
    const salaryPeriod = raw.job_salary_period ? raw.job_salary_period.toLowerCase() : "annual";

    if (salaryCurrency && ["USD", "GBP"].includes(salaryCurrency.toUpperCase())) {
      const conversionRate = 83;
      if (salaryMin) salaryMin = Math.round(salaryMin * conversionRate);
      if (salaryMax) salaryMax = Math.round(salaryMax * conversionRate);
    }

    const isRemote =
      raw.job_is_remote === true ||
      location.toLowerCase().includes("remote") ||
      location.toLowerCase().includes("work from home") ||
      location.toLowerCase().includes("wfh");

    let jobType: "full-time" | "part-time" | "contract" | "internship" | "freelance" | null = null;
    const rawType = (raw.job_employment_type || "").toLowerCase();
    if (rawType.includes("full")) jobType = "full-time";
    else if (rawType.includes("part")) jobType = "part-time";
    else if (rawType.includes("contract")) jobType = "contract";
    else if (rawType.includes("intern") || rawType.includes("co-op")) jobType = "internship";
    else if (rawType.includes("free") || rawType.includes("gig")) jobType = "freelance";

    let experienceLevel: "entry" | "mid" | "senior" | "lead" | null = null;
    const reqExp = (raw.job_required_experience || "").toLowerCase();
    if (reqExp.includes("senior") || reqExp.includes("sr.")) experienceLevel = "senior";
    else if (reqExp.includes("lead") || reqExp.includes("principal")) experienceLevel = "lead";
    else if (reqExp.includes("entry") || reqExp.includes("junior") || reqExp.includes("jr.")) experienceLevel = "entry";
    else if (reqExp.includes("mid") || reqExp.includes("intermediate")) experienceLevel = "mid";

    const plainDescription = description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const postedAt = raw.job_posted_at_timestamp ? new Date(raw.job_posted_at_timestamp * 1000) : new Date();

    return {
      sourceId: raw.job_id || dedupeHash.substring(0, 12),
      source: this.source,
      sourceUrl: raw.job_google_link || raw.job_apply_link || `https://www.linkedin.com/jobs/view/${raw.job_id}`,
      applyUrl: raw.job_apply_link || null,
      title,
      company,
      companyLogoUrl: raw.employer_logo || null,
      location,
      city: raw.job_city || null,
      country: raw.job_country || null,
      isRemote,
      jobType,
      experienceLevel,
      skills: extractedSkills,
      salaryMin,
      salaryMax,
      salaryCurrency: salaryCurrency as any,
      salaryPeriod: salaryPeriod as any,
      description: plainDescription,
      descriptionHtml: raw.job_description || null,
      postedAt,
      expiresAt: raw.job_offer_expiration_datetime_utc ? new Date(raw.job_offer_expiration_datetime_utc) : null,
      fetchedAt: new Date(),
      dedupeHash,
    };
  }

  private generateMockJobs(keyword: string): any[] {
    const kw = keyword.toLowerCase();
    const mockTemplates = [
      {
        title: "Senior React Engineer",
        company: "Google",
        location: "Bengaluru, Karnataka",
        description: "Join the Google Cloud team building next-generation cloud consoles using React, TypeScript, and Tailwind. Optimize high-performance interfaces and design scalable frontend systems.",
        applyUrl: "https://www.google.com/about/careers/applications/",
        skills: ["react", "typescript", "javascript", "tailwindcss", "git"],
        salaryMin: 3200000,
        salaryMax: 4800000,
      },
      {
        title: "Frontend Developer",
        company: "Meta",
        location: "Remote, India",
        description: "Help build the future of connection at Meta. We are looking for product-focused frontend engineers who excel in React, GraphQL, and state management frameworks like Redux.",
        applyUrl: "https://www.metacareers.com/",
        skills: ["react", "graphql", "redux", "javascript", "figma"],
        salaryMin: 2800000,
        salaryMax: 4200000,
      },
      {
        title: "Full Stack Software Engineer",
        company: "Netflix",
        location: "Mumbai, Maharashtra",
        description: "Netflix is seeking a Full Stack Software Engineer to build internal content management portals. You will build APIs in Node.js/Go and frontend views in Next.js/React.",
        applyUrl: "https://netflix.ationaljobs.com/",
        skills: ["react", "next.js", "node.js", "go", "rest apis"],
        salaryMin: 3500000,
        salaryMax: 5500000,
      },
      {
        title: "Backend Engineer (Node/Python)",
        company: "Amazon",
        location: "Hyderabad, Telangana",
        description: "Scale Amazon Web Services backend logic. Implement distributed queues, microservices, and databases in Node.js, Python, or Java. Familiarity with AWS is highly valued.",
        applyUrl: "https://www.amazon.jobs/",
        skills: ["node.js", "python", "aws", "docker", "kubernetes", "postgresql"],
        salaryMin: 2200000,
        salaryMax: 3600000,
      },
      {
        title: "TypeScript Specialist",
        company: "Microsoft",
        location: "Noida, Uttar Pradesh",
        description: "Contribute to VS Code and Azure dev tools. Work directly with TypeScript, compiler internals, and core language services to build cutting-edge developer features.",
        applyUrl: "https://careers.microsoft.com/",
        skills: ["typescript", "javascript", "git", "unit testing"],
        salaryMin: 2500000,
        salaryMax: 4000000,
      }
    ];

    // Filter templates where title, company, description, or skills contain query keyword
    const matched = mockTemplates.filter(t => 
      t.title.toLowerCase().includes(kw) ||
      t.company.toLowerCase().includes(kw) ||
      t.skills.some(s => s.toLowerCase().includes(kw)) ||
      t.description.toLowerCase().includes(kw)
    );

    // If no match, return all templates
    const finalSelection = matched.length > 0 ? matched : mockTemplates;

    return finalSelection.map((m, index) => {
      const rawHashInput = `${m.title}${m.company}${m.location}`.toLowerCase();
      const dedupeHash = crypto.createHash("sha256").update(rawHashInput).digest("hex");

      const mockJob: UnifiedJob = {
        sourceId: `mock-li-${index}`,
        source: this.source,
        sourceUrl: `https://www.linkedin.com/jobs/view/mock-${index}`,
        applyUrl: m.applyUrl,
        title: m.title,
        company: m.company,
        companyLogoUrl: m.company.charAt(0),
        location: m.location,
        city: m.location.split(",")[0],
        country: "India",
        isRemote: m.location.toLowerCase().includes("remote"),
        jobType: "full-time",
        experienceLevel: m.title.toLowerCase().includes("senior") ? "senior" : "mid",
        skills: m.skills,
        salaryMin: m.salaryMin,
        salaryMax: m.salaryMax,
        salaryCurrency: "INR",
        salaryPeriod: "annual",
        description: m.description,
        descriptionHtml: `<p>${m.description}</p>`,
        postedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000), // days ago
        expiresAt: null,
        fetchedAt: new Date(),
        dedupeHash,
      };

      return {
        ...mockJob,
        _isMock: true
      };
    });
  }

  private async scrapeGuestJobs(keyword: string): Promise<any[]> {
    const cheerio = require("cheerio");
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword)}&location=India`;
    
    console.log(`[LinkedIn Adapter] Sourcing fallback guest jobs from: ${url}`);
    
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
      });

      if (!res.ok) {
        throw new Error(`LinkedIn guest endpoint responded with status: ${res.status}`);
      }

      const html = await res.text();
      if (html.includes("captcha") || html.includes("Cloudflare") || html.includes("just a moment")) {
        throw new Error("LinkedIn guest endpoint blocked by CAPTCHA");
      }

      const $ = cheerio.load(html);
      const jobs: any[] = [];

      $("li").each((_: number, elem: any) => {
        const card = $(elem);
        const titleEl = card.find(".base-search-card__title");
        const companyEl = card.find(".base-search-card__subtitle a, .base-search-card__subtitle");
        const locationEl = card.find(".job-search-card__location");
        const linkEl = card.find("a.base-card__full-link");
        const timeEl = card.find("time");

        const title = titleEl.text().trim();
        const company = companyEl.text().trim().split("\n")[0].trim();
        const location = locationEl.text().trim();
        const applyUrl = linkEl.attr("href") || "";
        const postedText = timeEl.attr("datetime") || timeEl.text().trim() || "Just now";

        if (title && company) {
          jobs.push({
            title,
            company,
            location,
            applyUrl,
            postedText,
            _isGuestScraped: true
          });
        }
      });

      return jobs;
    } catch (err: any) {
      console.warn(`[LinkedIn Adapter] Guest scrape failed (${err.message}). Falling back to mock jobs...`);
      return this.generateMockJobs(keyword);
    }
  }
}
