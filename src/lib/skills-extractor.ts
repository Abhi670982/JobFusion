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

  const normalizedText = text.toLowerCase().replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ");
  const matchedSkills: Set<string> = new Set();

  for (const skill of PREDEFINED_SKILLS) {
    for (const alias of skill.aliases) {
      // Check if alias contains special chars (+, #, ., etc.)
      const hasSpecialChar = /[^a-z0-9\s]/i.test(alias);
      let isMatch = false;

      if (hasSpecialChar) {
        // Direct substring match with boundary checks
        const escaped = escapeRegExp(alias);
        // Make sure it is not part of a larger alphanumeric word
        const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, "i");
        isMatch = regex.test(normalizedText);
      } else {
        // Standard word boundary match
        const regex = new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i");
        isMatch = regex.test(normalizedText);
      }

      if (isMatch) {
        matchedSkills.add(skill.name);
        break; // Match found for this skill, move to next skill
      }
    }
  }

  // Map to the Profile.skills format: { name: string, level: number }
  return Array.from(matchedSkills).map(name => ({
    name,
    level: 80 // Default level for auto-extracted skills
  }));
}
