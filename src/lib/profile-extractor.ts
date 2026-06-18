export interface ExtractedExperience {
  company: string;
  role: string;
  period: string;
  duration?: string;
  description: string;
  skills?: string[];
}

export interface ExtractedEducation {
  school: string;
  degree: string;
  period: string;
}

export interface ExtractedProject {
  name: string;
  description: string;
  tech?: string[];
}

export interface ExtractedProfileDetails {
  phone: string;
  location: string;
  portfolioUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  resumeCategory: string;
  resumeSummary: string;
  suggestedRoles: string[];
  resumeInsights: {
    found: string[];
    missing: string[];
    tips: string[];
  };
  bio?: string;
  experiences?: ExtractedExperience[];
  education?: ExtractedEducation[];
  projects?: ExtractedProject[];
}

/**
 * Escapes regex special characters
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Robust regex-based fallback extractor for profile details.
 */
export function extractProfileDetailsLocally(text: string): ExtractedProfileDetails {
  const result: ExtractedProfileDetails = {
    phone: "",
    location: "",
    portfolioUrl: "",
    linkedinUrl: "",
    githubUrl: "",
    resumeCategory: "",
    resumeSummary: "",
    suggestedRoles: [],
    resumeInsights: {
      found: [],
      missing: [],
      tips: []
    },
    bio: "",
    experiences: [],
    education: [],
    projects: []
  };

  if (!text) return result;

  const normalizedText = text.replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ");

  // 1. Phone number extraction
  // Matches typical international formats, e.g. +91 9876543210, +1 (555) 019-2834, etc.
  const phoneRegexes = [
    /(?:\+91[\-\s]?)?[6-9]\d{9}/g, // Indian mobiles
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // US/General
    /\+?\d{1,4}[-.\s]?\d{2,5}[-.\s]?\d{2,5}[-.\s]?\d{2,5}/g // General international
  ];

  for (const regex of phoneRegexes) {
    const matches = normalizedText.match(regex);
    if (matches && matches.length > 0) {
      // Find the first match that is reasonably sized (e.g. not a random short number)
      const validPhone = matches.find(p => p.replace(/[^0-9]/g, "").length >= 10);
      if (validPhone) {
        result.phone = validPhone.trim();
        break;
      }
    }
  }

  // 2. Social URLs extraction
  // Strip email addresses first to avoid matching parts of them as portfolio domains
  const textWithoutEmails = normalizedText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "");

  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-\u00C0-\u00FF]+/i;
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_\-]+/i;
  
  // Matches general URLs excluding common sites
  const portfolioRegex = /\b(?:https?:\/\/)?(?:www\.)?(?!(?:linkedin|github|google|facebook|twitter|instagram|youtube|medium)\.com)[a-zA-Z0-9\-\.]+\.[a-z]{2,4}(?:\/[^\s]*)?/gi;

  const liMatch = textWithoutEmails.match(linkedinRegex);
  if (liMatch) {
    result.linkedinUrl = liMatch[0];
  }

  const ghMatch = textWithoutEmails.match(githubRegex);
  if (ghMatch) {
    result.githubUrl = ghMatch[0];
  }

  const portMatches = textWithoutEmails.match(portfolioRegex);
  if (portMatches && portMatches.length > 0) {
    // Return the first match
    result.portfolioUrl = portMatches[0];
  }

  // 3. Location extraction (heuristic)
  // Look for keywords like "location:", "address:", "lives in", etc.
  const lines = text.split(/\r?\n/);
  const locationKeywords = [
    /location\s*:\s*(.*)/i,
    /address\s*:\s*(.*)/i,
    /lives\s+in\s*(.*)/i,
    /resides\s+in\s*(.*)/i,
    /based\s+in\s*(.*)/i,
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    for (const kw of locationKeywords) {
      const match = trimmed.match(kw);
      if (match && match[1]) {
        const value = match[1].trim().replace(/^[:\-\s\•]+/, "").trim();
        if (value.length > 2 && value.length < 50) {
          result.location = value;
          break;
        }
      }
    }
    if (result.location) break;
  }

  // If no explicit keyword, look at early lines for a city, country format (e.g. "Mumbai, India")
  if (!result.location) {
    const cityCountryRegex = /\b([A-Z][a-zA-Z\s]+),\s*([A-Z][a-zA-Z\s]+|[A-Z]{2,3})\b/;
    // Check first 15 lines (usually headers contain location)
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const line = lines[i].trim();
      if (line.includes(",") && cityCountryRegex.test(line)) {
        // Exclude lines that look like university names or job titles
        const lower = line.toLowerCase();
        if (!lower.includes("university") && !lower.includes("college") && !lower.includes("school") && !lower.includes("ltd") && !lower.includes("inc")) {
          const match = line.match(cityCountryRegex);
          if (match) {
            result.location = match[0].trim();
            break;
          }
        }
      }
    }
  }

  return result;
}

/**
 * Call Gemini AI to semantically extract profile details from the resume text.
 * Falls back to the local regex parser if the API fails or is not configured.
 */
export async function extractProfileDetails(text: string): Promise<ExtractedProfileDetails> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("AIzaSyCt4XyZ8aB_C9dEfG_HiJkLmNoPqRsTuVw")) {
    console.warn("[Profile Extractor] GEMINI_API_KEY is not set or is placeholder. Using local regex extraction fallback.");
    return extractProfileDetailsLocally(text);
  }

  try {
    console.log("[Profile Extractor] Sending request to Google Gemini API...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
You are an expert resume parsing assistant. Analyze the following resume text.
Extract the contact details, career intelligence, and profile sections:
1. Phone number (format nicely like '+91 XXXXX XXXXX' or similar).
2. Location (City, State/Country like 'Bengaluru, India' or 'San Francisco, CA').
3. Portfolio website URL (personal website, portfolio).
4. LinkedIn URL.
5. GitHub URL.
6. Resume Category (a single career category like 'Software Engineering', 'Data Science', 'Finance', 'Human Resources', 'Marketing', etc.).
7. Resume Summary (a concise 2-3 sentence professional summary based on the candidate's experience).
8. Suggested Roles (an array of 3-5 job title suggestions suited for this resume).
9. Resume Insights:
   - What We Found (array of 2-3 bullet points highlighting strong aspects of their resume, e.g. key projects, long tenure, relevant degree).
   - Missing Sections (array of 1-3 bullet points highlighting sections or crucial info they might have omitted, e.g. certifications, portfolio links, detailed project descriptions).
   - Tips to Improve (array of 2-3 actionable tips to improve the ATS compatibility or impact of their resume).
10. About Me (Bio) - a brief, professional summary paragraph introducing the candidate's background and core expertise (about 3-4 sentences).
11. Work Experience - list of previous jobs:
    - Company Name
    - Role / Job Title
    - Period / Dates (e.g. '2021 - 2023' or 'June 2020 - Present')
    - Duration (e.g. '2 years' or '6 months')
    - Job Description (concise summary of responsibilities and achievements)
    - Key Skills Used (array of skills used)
12. Education - list of degrees:
    - School / University Name
    - Degree / Major
    - Period / Dates (e.g., '2018 - 2022')
13. Projects - list of projects:
    - Project Name
    - Description
    - Technologies Used (array of technologies)

You must return your output in the following JSON format:
{
  "phone": "string (extracted phone number, or empty string if not found)",
  "location": "string (extracted location, or empty string if not found)",
  "portfolioUrl": "string (extracted portfolio website URL, or empty string if not found)",
  "linkedinUrl": "string (extracted LinkedIn URL, or empty string if not found)",
  "githubUrl": "string (extracted GitHub URL, or empty string if not found)",
  "resumeCategory": "string (extracted resume category, or empty string if not found)",
  "resumeSummary": "string (extracted resume summary, or empty string if not found)",
  "suggestedRoles": ["string (suggested roles)"],
  "resumeInsights": {
    "found": ["string (what was found)"],
    "missing": ["string (missing sections/info)"],
    "tips": ["string (actionable improvement tips)"]
  },
  "bio": "string (About Me/Bio paragraph, or empty if not found)",
  "experiences": [
    {
      "company": "string (company name)",
      "role": "string (job title)",
      "period": "string (period)",
      "duration": "string (duration, optional)",
      "description": "string (job description)",
      "skills": ["string (skills used)"]
    }
  ],
  "education": [
    {
      "school": "string (university name)",
      "degree": "string (degree/major)",
      "period": "string (period)"
    }
  ],
  "projects": [
    {
      "name": "string (project name)",
      "description": "string (project description)",
      "tech": ["string (technologies used)"]
    }
  ]
}

Resume Text:
---
${text}
---
`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error! status: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    const parsedResult = JSON.parse(responseText.trim());

    return {
      phone: parsedResult.phone || "",
      location: parsedResult.location || "",
      portfolioUrl: parsedResult.portfolioUrl || "",
      linkedinUrl: parsedResult.linkedinUrl || "",
      githubUrl: parsedResult.githubUrl || "",
      resumeCategory: parsedResult.resumeCategory || "",
      resumeSummary: parsedResult.resumeSummary || "",
      suggestedRoles: parsedResult.suggestedRoles || [],
      resumeInsights: parsedResult.resumeInsights || { found: [], missing: [], tips: [] },
      bio: parsedResult.bio || "",
      experiences: parsedResult.experiences || [],
      education: parsedResult.education || [],
      projects: parsedResult.projects || []
    };
  } catch (error) {
    console.error("[Profile Extractor] Failed to extract details using Gemini. Falling back to local parser:", error);
    return extractProfileDetailsLocally(text);
  }
}
