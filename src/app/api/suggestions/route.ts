import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";

export const dynamic = "force-dynamic";

const SUGGESTIONS_MAP: Record<string, string[]> = {
  skills: [
    "react", "javascript", "typescript", "node.js", "python", 
    "java", "c++", "sql", "docker", "aws", "git", "html5", 
    "css3", "next.js", "tailwind css", "mongodb", "postgresql", 
    "express.js", "django", "graphql", "figma", "machine learning",
    "data analysis", "rest apis", "ci/cd", "kubernetes", "redux",
    "nextauth", "prisma", "go", "rust", "swift", "kotlin", "flutter"
  ],
  locations: [
    "remote", "bengaluru, karnataka", "delhi ncr", "mumbai, maharashtra", 
    "hyderabad, telangana", "pune, maharashtra", "chennai, tamil nadu", 
    "san francisco, ca", "new york, ny", "london, uk", "berlin, germany",
    "singapore", "toronto, canada", "sydney, australia"
  ],
  roles: [
    "software engineer", "frontend developer", "backend developer", 
    "full stack developer", "data scientist", "ui/ux designer", 
    "product manager", "devops engineer", "mobile developer", 
    "ai/ml engineer", "solutions architect", "technical lead", "hr manager", "qa engineer"
  ],
  companies: [
    "google", "microsoft", "razorpay", "stripe", "amazon", 
    "meta", "netflix", "cred", "flipkart", "zomato", "tcs",
    "infosys", "wipro", "cognizant", "accenture", "uber"
  ],
  salaries: [
    "₹6l – ₹12l", "₹12l – ₹20l", "₹20l – ₹35l", "₹35l – ₹50l", "₹50l+"
  ],
  notice: [
    "immediate", "15 days", "30 days", "60 days", "90 days"
  ],
  experience: [
    "entry level", "1 year", "2 years", "3 years", "5+ years", "senior level"
  ],
  degrees: [
    "b.tech in computer science", "m.tech in computer science", 
    "b.s. in computer science", "m.s. in computer science", 
    "mca", "mba", "b.com", "b.sc", "phd"
  ]
};

// In-memory cache for fast lookups
const cache = new Map<string, string[]>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    if (!category || !SUGGESTIONS_MAP[category]) {
      return NextResponse.json({ success: true, suggestions: [] });
    }

    const cacheKey = `${category}:${q}`;
    if (cache.has(cacheKey)) {
      return NextResponse.json({ success: true, suggestions: cache.get(cacheKey) });
    }

    const localList = SUGGESTIONS_MAP[category];

    // For empty or extremely short inputs, return top local entries
    if (q.length < 2) {
      const defaultSuggestions = localList.slice(0, 5);
      cache.set(cacheKey, defaultSuggestions);
      return NextResponse.json({ success: true, suggestions: defaultSuggestions });
    }

    let dbSuggestions: string[] = [];

    // Real-time Database queries for roles and locations
    try {
      await connectDB();
      const regex = new RegExp(q, "i");

      if (category === "roles") {
        // Query matching job titles or company names
        const matchedJobs = await Job.find(
          { $or: [{ title: regex }, { company: regex }] },
          { title: 1, company: 1 }
        ).limit(30).lean();

        const uniqueMatches = new Set<string>();
        matchedJobs.forEach((job: any) => {
          if (job.title && job.title.toLowerCase().includes(q)) {
            uniqueMatches.add(job.title.toLowerCase());
          }
          if (job.company && job.company.toLowerCase().includes(q)) {
            uniqueMatches.add(job.company.toLowerCase());
          }
        });
        dbSuggestions = Array.from(uniqueMatches);

      } else if (category === "locations") {
        // Query matching locations, city, or country names
        const matchedJobs = await Job.find(
          { $or: [{ location: regex }, { city: regex }, { country: regex }] },
          { location: 1, city: 1, country: 1 }
        ).limit(40).lean();

        const uniqueMatches = new Set<string>();
        matchedJobs.forEach((job: any) => {
          if (job.location && job.location.toLowerCase().includes(q)) {
            uniqueMatches.add(job.location.toLowerCase());
          }
          if (job.city && job.city.toLowerCase().includes(q)) {
            uniqueMatches.add(job.city.toLowerCase());
          }
          if (job.country && job.country.toLowerCase().includes(q)) {
            uniqueMatches.add(job.country.toLowerCase());
          }
        });
        
        if ("remote".includes(q)) {
          uniqueMatches.add("remote");
        }
        dbSuggestions = Array.from(uniqueMatches);
      }
    } catch (dbErr: any) {
      console.warn("[Suggestions API] Database query failed — falling back to local/AI:", dbErr.message);
    }

    // Merge DB results with local predefined list to ensure we always get good results
    const combinedSet = new Set<string>(dbSuggestions);
    
    // Supplement from local dictionary if we have less than 5 suggestions
    if (combinedSet.size < 5) {
      const localMatches = localList.filter(item => item.toLowerCase().includes(q) && item.toLowerCase() !== q);
      for (const match of localMatches) {
        combinedSet.add(match.toLowerCase());
        if (combinedSet.size >= 5) break;
      }
    }

    const suggestions = Array.from(combinedSet)
      .filter(s => s.length > 0 && s !== q)
      .slice(0, 5);

    cache.set(cacheKey, suggestions);
    return NextResponse.json({ success: true, suggestions });
  } catch (err: any) {
    console.error("[Suggestions API] Failed to fetch suggestions:", err.message);

    // Fallback: local dictionary matching
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const localList = SUGGESTIONS_MAP[category] || [];
    const localMatches = localList
      .filter(item => item.toLowerCase().includes(q))
      .slice(0, 5);

    return NextResponse.json({ success: true, suggestions: localMatches });
  }
}
