import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Local predefined list maps for fallback or supplementation
const SUGGESTIONS_MAP: Record<string, string[]> = {
  skills: [
    "react", "javascript", "typescript", "node.js", "python", 
    "java", "c++", "sql", "docker", "aws", "git", "html5", 
    "css3", "next.js", "tailwind css", "mongodb", "postgresql", 
    "express.js", "django", "graphql", "figma", "machine learning",
    "data analysis", "rest apis", "ci/cd", "kubernetes", "redux",
    "nextauth", "prisma", "go", "rust", "swift", "kotlin", "flutter",
    "vue.js", "angular", "ruby on rails", "php", "c#", "scala"
  ],
  locations: [
    "remote", "bengaluru, karnataka", "delhi ncr", "mumbai, maharashtra", 
    "hyderabad, telangana", "pune, maharashtra", "chennai, tamil nadu", 
    "san francisco, ca", "new york, ny", "london, uk", "berlin, germany",
    "singapore", "toronto, canada", "sydney, australia", "noida, uttar pradesh",
    "gurugram, haryana"
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
  categories: [
    "engineering", "design", "product", "marketing", "sales", "finance", "hr", "operations"
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

// Levenshtein edit distance for fuzzy matching
function getEditDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// 5-Tier Sorting & Ranking Algorithm
function rankSuggestions(suggestions: string[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return suggestions.sort((a, b) => a.localeCompare(b));

  const exactMatches: string[] = [];
  const startsWithQuery: string[] = [];
  const startsWithWord: string[] = [];
  const containsQuery: string[] = [];
  const fuzzyMatches: { item: string; distance: number }[] = [];

  for (const s of suggestions) {
    const sLower = s.toLowerCase();

    if (sLower === q) {
      exactMatches.push(s);
    } else if (sLower.startsWith(q)) {
      startsWithQuery.push(s);
    } else if (sLower.split(/[\s,./\-\(\)]+/).some(word => word.startsWith(q))) {
      startsWithWord.push(s);
    } else if (sLower.includes(q)) {
      containsQuery.push(s);
    } else {
      const distance = getEditDistance(sLower, q);
      // Allow fuzzy match for similar words (max distance depends on length)
      const maxDistance = q.length <= 4 ? 1 : 2;
      if (distance <= maxDistance) {
        fuzzyMatches.push({ item: s, distance });
      }
    }
  }

  // Sort each category alphabetically
  const sortFn = (a: string, b: string) => a.localeCompare(b);
  exactMatches.sort(sortFn);
  startsWithQuery.sort(sortFn);
  startsWithWord.sort(sortFn);
  containsQuery.sort(sortFn);
  fuzzyMatches.sort((a, b) => a.distance - b.distance || a.item.localeCompare(b.item));

  return [
    ...exactMatches,
    ...startsWithQuery,
    ...startsWithWord,
    ...containsQuery,
    ...fuzzyMatches.map(f => f.item)
  ];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    if (!category || !SUGGESTIONS_MAP[category]) {
      return NextResponse.json({ success: true, suggestions: [] });
    }

    const cacheKey = `${category}:${q.toLowerCase()}:${limit}`;
    if (cache.has(cacheKey)) {
      return NextResponse.json({ success: true, suggestions: cache.get(cacheKey) });
    }

    const localList = SUGGESTIONS_MAP[category];

    // For empty inputs, return top local entries
    if (q.length === 0) {
      const defaultSuggestions = localList.slice(0, limit);
      cache.set(cacheKey, defaultSuggestions);
      return NextResponse.json({ success: true, suggestions: defaultSuggestions });
    }

    let dbSuggestions: string[] = [];

    try {
      if (category === "roles") {
        const [titles, companies] = await Promise.all([
          prisma.job.findMany({
            select: { title: true },
            where: { title: { contains: q, mode: "insensitive" } },
            distinct: ["title"],
            take: 100
          }),
          prisma.job.findMany({
            select: { company: true },
            where: { company: { contains: q, mode: "insensitive" } },
            distinct: ["company"],
            take: 100
          })
        ]);
        dbSuggestions = Array.from(new Set([
          ...titles.map(t => t.title),
          ...companies.map(c => c.company)
        ]));
      } else if (category === "locations") {
        const [locs, cities, countries] = await Promise.all([
          prisma.job.findMany({
            select: { location: true },
            where: { location: { contains: q, mode: "insensitive" } },
            distinct: ["location"],
            take: 100
          }),
          prisma.job.findMany({
            select: { city: true },
            where: { city: { contains: q, mode: "insensitive" } },
            distinct: ["city"],
            take: 100
          }),
          prisma.job.findMany({
            select: { country: true },
            where: { country: { contains: q, mode: "insensitive" } },
            distinct: ["country"],
            take: 100
          })
        ]);
        dbSuggestions = Array.from(new Set([
          ...locs.map(l => l.location).filter(Boolean),
          ...cities.map(c => c.city).filter(Boolean),
          ...countries.map(c => c.country).filter(Boolean)
        ] as string[]));
        if ("remote".includes(q.toLowerCase())) {
          dbSuggestions.push("remote");
        }
      } else if (category === "skills") {
        const matchedSkills: { skill: string }[] = await prisma.$queryRaw`
          SELECT DISTINCT skill FROM (
            SELECT unnest(skills) as skill FROM jobs
          ) s 
          WHERE skill ILIKE ${'%' + q + '%'}
          LIMIT 100
        `;
        dbSuggestions = matchedSkills.map(r => r.skill);
      } else if (category === "companies") {
        const companies = await prisma.job.findMany({
          select: { company: true },
          where: { company: { contains: q, mode: "insensitive" } },
          distinct: ["company"],
          take: 100
        });
        dbSuggestions = companies.map(c => c.company);
      } else if (category === "categories") {
        const categories = await prisma.job.findMany({
          select: { category: true },
          where: { category: { contains: q, mode: "insensitive" } },
          distinct: ["category"],
          take: 100
        });
        dbSuggestions = categories.map(c => c.category);
      }
    } catch (dbErr: any) {
      console.warn("[Suggestions API] Database query failed — falling back to local:", dbErr.message);
    }

    // Merge database results with local predefined templates
    const combinedSet = new Set<string>();
    
    // Add DB results normalized to match original casing if possible
    dbSuggestions.forEach(item => {
      if (item && item.trim()) combinedSet.add(item.trim());
    });

    // Supplement with local suggestions matching the query
    const localMatches = localList.filter(item => {
      const itemLower = item.toLowerCase();
      const qLower = q.toLowerCase();
      return itemLower.includes(qLower) || getEditDistance(itemLower, qLower) <= (qLower.length <= 4 ? 1 : 2);
    });

    localMatches.forEach(item => combinedSet.add(item));

    // Convert Set back to Array and rank
    const rawList = Array.from(combinedSet);
    const ranked = rankSuggestions(rawList, q);
    
    // Slice to the requested limit
    const suggestions = ranked.slice(0, limit);

    cache.set(cacheKey, suggestions);
    return NextResponse.json({ success: true, suggestions });
  } catch (err: any) {
    console.error("[Suggestions API] Failed to fetch suggestions:", err.message);
    
    // Fallback dictionary match
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    
    const localList = SUGGESTIONS_MAP[category] || [];
    const localMatches = localList.filter(item => item.toLowerCase().includes(q));
    const ranked = rankSuggestions(localMatches, q);

    return NextResponse.json({ success: true, suggestions: ranked.slice(0, limit) });
  }
}
