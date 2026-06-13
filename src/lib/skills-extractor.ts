export interface SkillDefinition {
  name: string;
  aliases: string[];
}

// Predefined list of popular technical skills and their common aliases / abbreviations
export const PREDEFINED_SKILLS: SkillDefinition[] = [
  { name: "JavaScript", aliases: ["javascript", "js", "ecmascript"] },
  { name: "TypeScript", aliases: ["typescript", "ts"] },
  { name: "React", aliases: ["react", "react.js", "reactjs"] },
  { name: "Next.js", aliases: ["next.js", "nextjs"] },
  { name: "Node.js", aliases: ["node.js", "nodejs", "node"] },
  { name: "Python", aliases: ["python", "py"] },
  { name: "Java", aliases: ["java"] },
  { name: "C++", aliases: ["c++", "cpp"] },
  { name: "C#", aliases: ["c#", "csharp", "net core", ".net"] },
  { name: "Go", aliases: ["go", "golang"] },
  { name: "Rust", aliases: ["rust", "rustlang"] },
  { name: "Ruby on Rails", aliases: ["ruby on rails", "rails", "ruby"] },
  { name: "PHP", aliases: ["php", "laravel", "symfony"] },
  { name: "HTML", aliases: ["html", "html5"] },
  { name: "CSS", aliases: ["css", "css3", "sass", "scss", "less"] },
  { name: "Tailwind CSS", aliases: ["tailwind css", "tailwindcss", "tailwind"] },
  { name: "Redux", aliases: ["redux", "redux-toolkit", "rtk"] },
  { name: "GraphQL", aliases: ["graphql", "gql"] },
  { name: "Express.js", aliases: ["express", "express.js", "expressjs"] },
  { name: "NestJS", aliases: ["nestjs", "nest.js"] },
  { name: "Spring Boot", aliases: ["spring boot", "springboot", "spring framework"] },
  { name: "Django", aliases: ["django"] },
  { name: "Flask", aliases: ["flask"] },
  { name: "FastAPI", aliases: ["fastapi"] },
  { name: "MongoDB", aliases: ["mongodb", "mongo"] },
  { name: "MySQL", aliases: ["mysql", "my sql"] },
  { name: "PostgreSQL", aliases: ["postgresql", "postgres", "psql"] },
  { name: "Redis", aliases: ["redis"] },
  { name: "Elasticsearch", aliases: ["elasticsearch", "elastic search"] },
  { name: "SQLite", aliases: ["sqlite"] },
  { name: "Prisma", aliases: ["prisma"] },
  { name: "Firebase", aliases: ["firebase", "firestore"] },
  { name: "Docker", aliases: ["docker", "dockerfile"] },
  { name: "Kubernetes", aliases: ["kubernetes", "k8s"] },
  { name: "AWS", aliases: ["aws", "amazon web services", "s3", "ec2", "rds", "lambda"] },
  { name: "Azure", aliases: ["azure", "microsoft azure"] },
  { name: "Google Cloud Platform", aliases: ["gcp", "google cloud", "google cloud platform"] },
  { name: "Git", aliases: ["git", "github", "gitlab", "bitbucket"] },
  { name: "Linux", aliases: ["linux", "ubuntu", "debian", "redhat", "centos"] },
  { name: "Data Structures", aliases: ["data structures", "algorithms", "dsa"] },
  { name: "Machine Learning", aliases: ["machine learning", "ml", "scikit-learn", "tensorflow", "pytorch"] },
  { name: "Artificial Intelligence", aliases: ["artificial intelligence", "ai", "deep learning", "nlp", "llm", "llms", "openai"] },
  { name: "CI/CD", aliases: ["ci/cd", "cicd", "jenkins", "github actions", "gitlab ci"] },
  { name: "Terraform", aliases: ["terraform"] },
  { name: "Flutter", aliases: ["flutter"] },
  { name: "React Native", aliases: ["react native", "reactnative"] },
  { name: "Swift", aliases: ["swift", "ios development"] },
  { name: "Kotlin", aliases: ["kotlin", "android development"] },
  { name: "System Design", aliases: ["system design", "distributed systems", "microservices"] },
  { name: "REST APIs", aliases: ["rest api", "rest apis", "restful api", "restful apis"] },
  { name: "WebSockets", aliases: ["websockets", "websocket", "socket.io"] },
  { name: "Unit Testing", aliases: ["unit testing", "jest", "mocha", "chai", "cypress", "testing library"] },
  { name: "Figma", aliases: ["figma"] },
  { name: "UI/UX Design", aliases: ["ui/ux", "user interface", "user experience", "product design"] },
  { name: "Agile", aliases: ["agile", "scrum", "kanban"] },
  { name: "Jira", aliases: ["jira"] }
];

/**
 * Escapes regex special characters
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parses raw resume text and extracts matching predefined technical skills.
 * Normalizes results and assigns a default proficiency level (e.g. 80%).
 */
export function extractSkills(text: string): { name: string; level: number }[] {
  if (!text) return [];

  const matchedSkills: Set<string> = new Set();

  // 1. Match against predefined tech skills list
  const normalizedText = text.toLowerCase().replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ");
  for (const skill of PREDEFINED_SKILLS) {
    for (const alias of skill.aliases) {
      const hasSpecialChar = /[^a-z0-9\s]/i.test(alias);
      let isMatch = false;

      if (hasSpecialChar) {
        const escaped = escapeRegExp(alias);
        const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, "i");
        isMatch = regex.test(normalizedText);
      } else {
        const regex = new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i");
        isMatch = regex.test(normalizedText);
      }

      if (isMatch) {
        matchedSkills.add(skill.name);
        break;
      }
    }
  }

  // 2. Parse the extracted Skills section to capture non-predefined skills (e.g. Finance, HR, Marketing, custom skills)
  const skillsSection = extractSkillsSectionLocally(text);
  if (skillsSection) {
    const lines = skillsSection.split(/\r?\n/);
    const skillsHeadings = [
      /^\s*(technical\s+)?skills\s*$/i,
      /^\s*technologies\s*$/i,
      /^\s*core\s+competencies\s*$/i,
      /^\s*skills\s*&\s*(tools|technologies)\s*$/i,
      /^\s*tools\s*&\s*technologies\s*$/i,
      /^\s*key\s+skills\s*$/i,
      /^\s*areas\s+of\s+expertise\s*$/i,
      /^\s*expertise\s*$/i,
      /^\s*skills\s+summary\s*$/i,
    ];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Skip the heading line itself
      const isHeading = skillsHeadings.some(h => h.test(trimmedLine));
      if (isHeading) continue;

      // Split line by common separators like comma, semicolon, pipe, bullets, or multiple spaces
      const parts = trimmedLine.split(/[,;|•\t\-\*]|\s{2,}/);
      for (let part of parts) {
        // Clean up leading/trailing bullet indicators and trim
        part = part.replace(/^[\s•\-\*\d\.\)\(]+/g, "").replace(/[\s•\-\*\d\.\)\(]+$/g, "").trim();
        
        // Basic length validation (2-40 characters)
        if (part.length >= 2 && part.length <= 40) {
          const lowerPart = part.toLowerCase();
          const exists = Array.from(matchedSkills).some(s => s.toLowerCase() === lowerPart);
          if (!exists) {
            // Format to Title Case for nice presentation
            const formattedName = part
              .split(/\s+/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(" ");
            
            const isHeadingWord = ["skills", "technical", "technologies", "tools", "expertise"].includes(lowerPart);
            if (!isHeadingWord) {
              matchedSkills.add(formattedName);
            }
          }
        }
      }
    }
  }

  // Map to the Profile.skills format: { name: string, level: number }
  return Array.from(matchedSkills).map(name => ({
    name,
    level: 80 // Default level for auto-extracted skills
  }));
}

/**
 * Call Google Gemini API to semantically extract:
 * 1. The raw text/content of the 'Skills' section.
 * 2. A list of individual skills with their estimated proficiency levels.
 * Falls back to the local regex-based extractor if the API fails or is not configured.
 */
/**
 * Heuristically extracts the raw text of the "Skills" section of a resume from the raw text
 */
export function extractSkillsSectionLocally(text: string): string {
  if (!text) return "";

  const lines = text.split(/\r?\n/);
  const skillsHeadings = [
    /^\s*(technical\s+)?skills\s*$/i,
    /^\s*technologies\s*$/i,
    /^\s*core\s+competencies\s*$/i,
    /^\s*skills\s*&\s*(tools|technologies)\s*$/i,
    /^\s*tools\s*&\s*technologies\s*$/i,
    /^\s*key\s+skills\s*$/i,
    /^\s*areas\s+of\s+expertise\s*$/i,
    /^\s*expertise\s*$/i,
    /^\s*skills\s+summary\s*$/i,
  ];

  const stopHeadings = [
    /^\s*experience(s)?\s*$/i,
    /^\s*work\s+history\s*$/i,
    /^\s*professional\s+experience\s*$/i,
    /^\s*employment\s+(history|details)\s*$/i,
    /^\s*education\s*$/i,
    /^\s*project(s)?\s*$/i,
    /^\s*certification(s)?\s*$/i,
    /^\s*achievement(s)?\s*$/i,
    /^\s*academic\s+credentials\s*$/i,
    /^\s*languages\s*$/i,
    /^\s*interests\s*$/i,
    /^\s*summary\s*$/i,
    /^\s*objective\s*$/i,
    /^\s*about\s+me\s*$/i,
    /^\s*contact(s)?\s*$/i,
  ];

  let inSkillsSection = false;
  const accumulatedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if this line is a skills heading
    const isSkillsHeading = skillsHeadings.some(h => h.test(line));
    if (isSkillsHeading) {
      inSkillsSection = true;
      accumulatedLines.push(lines[i]); // include heading
      continue;
    }

    if (inSkillsSection) {
      // Check if we hit a stop heading
      const isStopHeading = stopHeadings.some(h => h.test(line));
      if (isStopHeading) {
        break; // stop parsing
      }
      accumulatedLines.push(lines[i]);
    }
  }

  return accumulatedLines.join("\n").trim();
}

export async function extractSkillsWithGemini(text: string): Promise<{
  skillsSectionContent: string;
  skillsList: { name: string; level: number }[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("AIzaSyCt4XyZ8aB_C9dEfG_HiJkLmNoPqRsTuVw")) {
    console.warn("[Skills Extractor] GEMINI_API_KEY is not set or is placeholder. Using local regex extraction fallback.");
    const localSkills = extractSkills(text);
    const localSection = extractSkillsSectionLocally(text);
    const skillsSectionContent = localSection || (localSkills.length > 0
      ? `Skills:\n${localSkills.map(s => `- ${s.name} (Proficiency: ${s.level}%)`).join("\n")}`
      : "No technical skills identified in the resume.");
    
    return {
      skillsSectionContent,
      skillsList: localSkills
    };
  }

  try {
    console.log("[Skills Extractor] Sending request to Google Gemini API...");
    
    // Using gemini-1.5-flash as it is fast and supports JSON output
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = `
You are an expert resume parsing assistant. Analyze the following resume text.
1. Extract the exact text or content of the 'Skills' section (e.g., Technical Skills, Core Competencies, Technologies, Tools, etc.) as it appears in the resume. Maintain its organization and structure.
2. Extract all individual skills (programming languages, libraries, frameworks, cloud services, tools, databases, methodologies) listed in the resume. For each skill, estimate a proficiency level between 10 and 100 based on their experience, projects, or mention frequency (defaulting to 80 if not explicitly clear).

You must return your output in the following JSON format:
{
  "skillsSectionContent": "string (the raw or structured skills section content extracted from the resume)",
  "skillsList": [
    { "name": "string (name of the skill)", "level": number }
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
      skillsSectionContent: parsedResult.skillsSectionContent || "",
      skillsList: parsedResult.skillsList || []
    };
  } catch (error) {
    console.error("[Skills Extractor] Failed to extract skills using Gemini. Falling back to local parser:", error);
    const localSkills = extractSkills(text);
    const localSection = extractSkillsSectionLocally(text);
    const skillsSectionContent = localSection || (localSkills.length > 0
      ? `Skills (Local Fallback):\n${localSkills.map(s => `- ${s.name}`).join("\n")}`
      : "No technical skills identified in the resume.");
    
    return {
      skillsSectionContent,
      skillsList: localSkills
    };
  }
}

