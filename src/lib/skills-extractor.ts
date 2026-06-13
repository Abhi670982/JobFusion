export interface SkillDefinition {
  name: string;
  aliases: string[];
  domain: string;
}

export const PREDEFINED_SKILLS: SkillDefinition[] = [
  // ── PROGRAMMING LANGUAGES ──
  { name: "JavaScript", aliases: ["javascript", "js", "ecmascript"], domain: "tech" },
  { name: "TypeScript", aliases: ["typescript", "ts"], domain: "tech" },
  { name: "Python", aliases: ["python", "py"], domain: "tech" },
  { name: "Java", aliases: ["java"], domain: "tech" },
  { name: "C++", aliases: ["c++", "cpp"], domain: "tech" },
  { name: "C#", aliases: ["c#", "csharp", ".net", "dotnet"], domain: "tech" },
  { name: "C", aliases: ["c language", " c programming"], domain: "tech" },
  { name: "Go", aliases: ["golang", "go language"], domain: "tech" },
  { name: "Rust", aliases: ["rust", "rustlang"], domain: "tech" },
  { name: "Ruby", aliases: ["ruby", "ruby on rails", "rails"], domain: "tech" },
  { name: "PHP", aliases: ["php", "laravel", "symfony"], domain: "tech" },
  { name: "Swift", aliases: ["swift", "ios development", "swiftui"], domain: "tech" },
  { name: "Kotlin", aliases: ["kotlin", "android development"], domain: "tech" },
  { name: "Dart", aliases: ["dart", "flutter"], domain: "tech" },
  { name: "R", aliases: [" r language", "r programming", "rstudio"], domain: "tech" },
  { name: "MATLAB", aliases: ["matlab"], domain: "tech" },
  { name: "Scala", aliases: ["scala"], domain: "tech" },
  { name: "Shell Scripting", aliases: ["bash", "shell script", "shell scripting", "powershell"], domain: "tech" },
  // ── WEB FRONTEND ──
  { name: "HTML", aliases: ["html", "html5"], domain: "tech" },
  { name: "CSS", aliases: ["css", "css3", "sass", "scss", "less"], domain: "tech" },
  { name: "React", aliases: ["react", "react.js", "reactjs"], domain: "tech" },
  { name: "Next.js", aliases: ["next.js", "nextjs"], domain: "tech" },
  { name: "Vue.js", aliases: ["vue", "vue.js", "vuejs"], domain: "tech" },
  { name: "Angular", aliases: ["angular", "angularjs"], domain: "tech" },
  { name: "Tailwind CSS", aliases: ["tailwind css", "tailwindcss", "tailwind"], domain: "tech" },
  { name: "Redux", aliases: ["redux", "redux-toolkit", "rtk", "zustand", "recoil"], domain: "tech" },
  { name: "Svelte", aliases: ["svelte", "sveltekit"], domain: "tech" },
  // ── WEB BACKEND ──
  { name: "Node.js", aliases: ["node.js", "nodejs", "node js"], domain: "tech" },
  { name: "Express.js", aliases: ["express", "express.js", "expressjs"], domain: "tech" },
  { name: "NestJS", aliases: ["nestjs", "nest.js"], domain: "tech" },
  { name: "Django", aliases: ["django"], domain: "tech" },
  { name: "Flask", aliases: ["flask"], domain: "tech" },
  { name: "FastAPI", aliases: ["fastapi"], domain: "tech" },
  { name: "Spring Boot", aliases: ["spring boot", "springboot", "spring framework"], domain: "tech" },
  { name: "GraphQL", aliases: ["graphql", "gql", "apollo"], domain: "tech" },
  { name: "REST APIs", aliases: ["rest api", "rest apis", "restful", "api development"], domain: "tech" },
  // ── DATABASES ──
  { name: "MongoDB", aliases: ["mongodb", "mongo", "mongoose"], domain: "tech" },
  { name: "MySQL", aliases: ["mysql"], domain: "tech" },
  { name: "PostgreSQL", aliases: ["postgresql", "postgres", "psql"], domain: "tech" },
  { name: "Redis", aliases: ["redis", "redis cache"], domain: "tech" },
  { name: "SQLite", aliases: ["sqlite"], domain: "tech" },
  { name: "Oracle DB", aliases: ["oracle", "oracle database", "pl/sql", "plsql"], domain: "tech" },
  { name: "SQL", aliases: ["sql", "structured query language", "t-sql", "tsql"], domain: "tech" },
  { name: "Firebase", aliases: ["firebase", "firestore", "firebase realtime"], domain: "tech" },
  { name: "Elasticsearch", aliases: ["elasticsearch", "elastic search", "opensearch"], domain: "tech" },
  { name: "Cassandra", aliases: ["cassandra", "apache cassandra"], domain: "tech" },
  { name: "Prisma", aliases: ["prisma", "prisma orm"], domain: "tech" },
  // ── DEVOPS & CLOUD ──
  { name: "Docker", aliases: ["docker", "dockerfile", "docker-compose"], domain: "tech" },
  { name: "Kubernetes", aliases: ["kubernetes", "k8s"], domain: "tech" },
  { name: "AWS", aliases: ["aws", "amazon web services", "ec2", "s3", "lambda", "rds", "cloudfront"], domain: "tech" },
  { name: "Azure", aliases: ["azure", "microsoft azure", "azure devops"], domain: "tech" },
  { name: "Google Cloud", aliases: ["gcp", "google cloud", "google cloud platform"], domain: "tech" },
  { name: "CI/CD", aliases: ["ci/cd", "cicd", "jenkins", "github actions", "gitlab ci", "circleci"], domain: "tech" },
  { name: "Terraform", aliases: ["terraform", "infrastructure as code", "iac"], domain: "tech" },
  { name: "Linux", aliases: ["linux", "ubuntu", "debian", "centos", "unix"], domain: "tech" },
  { name: "Nginx", aliases: ["nginx", "apache"], domain: "tech" },
  // ── DATA & AI ──
  { name: "Machine Learning", aliases: ["machine learning", "ml", "scikit-learn", "sklearn"], domain: "tech" },
  { name: "Deep Learning", aliases: ["deep learning", "neural network", "tensorflow", "pytorch", "keras"], domain: "tech" },
  { name: "Data Analysis", aliases: ["data analysis", "data analytics", "eda", "exploratory data analysis"], domain: "tech" },
  { name: "Data Science", aliases: ["data science", "data scientist"], domain: "tech" },
  { name: "NLP", aliases: ["nlp", "natural language processing", "text mining"], domain: "tech" },
  { name: "Computer Vision", aliases: ["computer vision", "image processing", "opencv"], domain: "tech" },
  { name: "Pandas", aliases: ["pandas"], domain: "tech" },
  { name: "NumPy", aliases: ["numpy"], domain: "tech" },
  { name: "Tableau", aliases: ["tableau"], domain: "tech" },
  { name: "Power BI", aliases: ["power bi", "powerbi", "microsoft power bi"], domain: "tech" },
  { name: "Spark", aliases: ["apache spark", "pyspark", "spark"], domain: "tech" },
  { name: "Hadoop", aliases: ["hadoop", "hdfs", "hive", "mapreduce"], domain: "tech" },
  // ── MOBILE ──
  { name: "Flutter", aliases: ["flutter", "dart flutter"], domain: "tech" },
  { name: "React Native", aliases: ["react native", "reactnative"], domain: "tech" },
  { name: "Android Development", aliases: ["android development", "android studio", "android sdk"], domain: "tech" },
  { name: "iOS Development", aliases: ["ios development", "xcode", "objective-c"], domain: "tech" },
  // ── TESTING ──
  { name: "Unit Testing", aliases: ["unit testing", "jest", "mocha", "chai", "junit", "pytest"], domain: "tech" },
  { name: "Selenium", aliases: ["selenium", "selenium webdriver"], domain: "tech" },
  { name: "Cypress", aliases: ["cypress", "e2e testing", "end-to-end testing"], domain: "tech" },
  { name: "QA Testing", aliases: ["qa testing", "quality assurance", "manual testing", "test cases", "test plans"], domain: "tech" },
  // ── VERSION CONTROL ──
  { name: "Git", aliases: ["git", "github", "gitlab", "bitbucket", "version control"], domain: "tech" },
  // ── SYSTEM DESIGN ──
  { name: "System Design", aliases: ["system design", "distributed systems", "microservices", "architecture"], domain: "tech" },
  { name: "Agile", aliases: ["agile", "scrum", "kanban", "sprint", "agile methodology"], domain: "tech" },
  { name: "Jira", aliases: ["jira", "confluence", "trello", "notion"], domain: "tech" },

  // ══════════════════════════════════════
  // ── DESIGN ──
  // ══════════════════════════════════════
  { name: "Figma", aliases: ["figma"], domain: "design" },
  { name: "Adobe Photoshop", aliases: ["photoshop", "adobe photoshop", "ps"], domain: "design" },
  { name: "Adobe Illustrator", aliases: ["illustrator", "adobe illustrator", "ai"], domain: "design" },
  { name: "Adobe XD", aliases: ["adobe xd", "xd"], domain: "design" },
  { name: "Canva", aliases: ["canva"], domain: "design" },
  { name: "InDesign", aliases: ["indesign", "adobe indesign"], domain: "design" },
  { name: "After Effects", aliases: ["after effects", "adobe after effects", "motion graphics"], domain: "design" },
  { name: "Premiere Pro", aliases: ["premiere pro", "adobe premiere", "video editing"], domain: "design" },
  { name: "Sketch", aliases: ["sketch", "sketch app"], domain: "design" },
  { name: "UI Design", aliases: ["ui design", "user interface design", "interface design"], domain: "design" },
  { name: "UX Design", aliases: ["ux design", "user experience", "user experience design"], domain: "design" },
  { name: "UX Research", aliases: ["ux research", "user research", "usability testing", "user testing"], domain: "design" },
  { name: "Wireframing", aliases: ["wireframing", "wireframes", "prototyping", "mockups"], domain: "design" },
  { name: "Design Systems", aliases: ["design system", "component library", "style guide"], domain: "design" },
  { name: "Typography", aliases: ["typography", "font design"], domain: "design" },
  { name: "Brand Design", aliases: ["branding", "brand identity", "visual identity", "logo design"], domain: "design" },
  { name: "3D Modeling", aliases: ["3d modeling", "blender", "maya", "3ds max", "autocad"], domain: "design" },
  { name: "Video Editing", aliases: ["video editing", "final cut pro", "davinci resolve"], domain: "design" },

  // ══════════════════════════════════════
  // ── MARKETING ──
  // ══════════════════════════════════════
  { name: "Digital Marketing", aliases: ["digital marketing", "online marketing"], domain: "marketing" },
  { name: "SEO", aliases: ["seo", "search engine optimization", "on-page seo", "off-page seo", "technical seo"], domain: "marketing" },
  { name: "SEM", aliases: ["sem", "search engine marketing", "google ads", "adwords", "ppc", "pay-per-click"], domain: "marketing" },
  { name: "Social Media Marketing", aliases: ["social media marketing", "smm", "social media management", "instagram marketing", "facebook ads"], domain: "marketing" },
  { name: "Content Marketing", aliases: ["content marketing", "content strategy", "content creation", "copywriting", "blogging"], domain: "marketing" },
  { name: "Email Marketing", aliases: ["email marketing", "mailchimp", "email campaigns", "drip campaigns"], domain: "marketing" },
  { name: "Marketing Analytics", aliases: ["marketing analytics", "google analytics", "web analytics", "ga4"], domain: "marketing" },
  { name: "Brand Management", aliases: ["brand management", "brand strategy", "brand building"], domain: "marketing" },
  { name: "Market Research", aliases: ["market research", "consumer research", "competitor analysis", "market analysis"], domain: "marketing" },
  { name: "Growth Hacking", aliases: ["growth hacking", "growth marketing", "growth strategy"], domain: "marketing" },
  { name: "Product Marketing", aliases: ["product marketing", "go-to-market", "gtm strategy"], domain: "marketing" },
  { name: "CRM", aliases: ["crm", "customer relationship management", "salesforce", "hubspot", "zoho crm"], domain: "marketing" },
  { name: "Public Relations", aliases: ["public relations", "pr", "media relations", "press release"], domain: "marketing" },
  { name: "E-commerce", aliases: ["e-commerce", "ecommerce", "shopify", "amazon fba", "marketplace"], domain: "marketing" },
  { name: "Affiliate Marketing", aliases: ["affiliate marketing", "performance marketing", "affiliate"], domain: "marketing" },
  { name: "Video Marketing", aliases: ["video marketing", "youtube marketing", "video production"], domain: "marketing" },

  // ══════════════════════════════════════
  // ── FINANCE & ACCOUNTING ──
  // ══════════════════════════════════════
  { name: "Financial Analysis", aliases: ["financial analysis", "financial modelling", "financial modeling"], domain: "finance" },
  { name: "Accounting", aliases: ["accounting", "bookkeeping", "general ledger", "accounts payable", "accounts receivable"], domain: "finance" },
  { name: "Taxation", aliases: ["taxation", "tax planning", "income tax", "gst", "goods and services tax", "tds", "itr"], domain: "finance" },
  { name: "Auditing", aliases: ["auditing", "audit", "internal audit", "statutory audit"], domain: "finance" },
  { name: "Tally", aliases: ["tally", "tally erp", "tally prime"], domain: "finance" },
  { name: "MS Excel", aliases: ["ms excel", "microsoft excel", "excel", "vlookup", "pivot table", "excel macros"], domain: "finance" },
  { name: "SAP", aliases: ["sap", "sap fico", "sap mm", "sap sd", "sap erp"], domain: "finance" },
  { name: "Financial Reporting", aliases: ["financial reporting", "financial statements", "balance sheet", "profit and loss", "p&l"], domain: "finance" },
  { name: "Investment Analysis", aliases: ["investment analysis", "portfolio management", "equity research", "fundamental analysis", "technical analysis"], domain: "finance" },
  { name: "Risk Management", aliases: ["risk management", "risk assessment", "risk analysis", "credit risk", "market risk"], domain: "finance" },
  { name: "Budgeting", aliases: ["budgeting", "forecasting", "financial planning", "fp&a"], domain: "finance" },
  { name: "Banking", aliases: ["banking", "retail banking", "investment banking", "corporate banking"], domain: "finance" },
  { name: "Insurance", aliases: ["insurance", "underwriting", "claims management", "actuarial"], domain: "finance" },
  { name: "Cost Accounting", aliases: ["cost accounting", "costing", "standard costing", "marginal costing"], domain: "finance" },
  { name: "QuickBooks", aliases: ["quickbooks", "quick books", "intuit quickbooks"], domain: "finance" },
  { name: "IFRS", aliases: ["ifrs", "gaap", "ind as", "accounting standards"], domain: "finance" },
  { name: "Derivatives", aliases: ["derivatives", "futures", "options trading", "forex"], domain: "finance" },

  // ══════════════════════════════════════
  // ── HR ──
  // ══════════════════════════════════════
  { name: "Recruitment", aliases: ["recruitment", "hiring", "talent acquisition", "sourcing", "headhunting"], domain: "hr" },
  { name: "HR Management", aliases: ["hr management", "human resource management", "hrm", "people management"], domain: "hr" },
  { name: "Payroll", aliases: ["payroll", "payroll processing", "payroll management", "salary processing"], domain: "hr" },
  { name: "Performance Management", aliases: ["performance management", "appraisal", "performance review", "kpi management"], domain: "hr" },
  { name: "Employee Relations", aliases: ["employee relations", "employee engagement", "ir", "industrial relations"], domain: "hr" },
  { name: "Training & Development", aliases: ["training", "training and development", "l&d", "learning and development", "coaching"], domain: "hr" },
  { name: "HRMS", aliases: ["hrms", "hris", "workday", "bamboohr", "darwinbox", "greythr", "keka"], domain: "hr" },
  { name: "Onboarding", aliases: ["onboarding", "employee onboarding", "induction"], domain: "hr" },
  { name: "Labour Law", aliases: ["labour law", "labor law", "employment law", "compliance", "pf", "esi", "gratuity"], domain: "hr" },
  { name: "Job Description Writing", aliases: ["job description", "jd writing", "job posting"], domain: "hr" },
  { name: "Campus Recruitment", aliases: ["campus recruitment", "campus hiring", "college hiring"], domain: "hr" },
  { name: "HR Analytics", aliases: ["hr analytics", "people analytics", "workforce analytics"], domain: "hr" },
  { name: "Compensation & Benefits", aliases: ["compensation", "benefits", "c&b", "total rewards", "ctc structuring"], domain: "hr" },

  // ══════════════════════════════════════
  // ── OPERATIONS & SUPPLY CHAIN ──
  // ══════════════════════════════════════
  { name: "Supply Chain Management", aliases: ["supply chain", "supply chain management", "scm"], domain: "operations" },
  { name: "Logistics", aliases: ["logistics", "logistics management", "freight", "warehousing"], domain: "operations" },
  { name: "Procurement", aliases: ["procurement", "sourcing", "vendor management", "purchase management", "vendor negotiation"], domain: "operations" },
  { name: "Inventory Management", aliases: ["inventory management", "inventory control", "stock management", "warehouse management"], domain: "operations" },
  { name: "Project Management", aliases: ["project management", "pmp", "prince2", "project coordination"], domain: "operations" },
  { name: "Process Improvement", aliases: ["process improvement", "lean", "six sigma", "kaizen", "bpm"], domain: "operations" },
  { name: "ERP", aliases: ["erp", "oracle erp", "sap erp", "enterprise resource planning"], domain: "operations" },
  { name: "Quality Management", aliases: ["quality management", "qms", "iso", "iso 9001", "quality control", "quality assurance"], domain: "operations" },
  { name: "Operations Management", aliases: ["operations management", "operational excellence", "ops management"], domain: "operations" },
  { name: "Business Analysis", aliases: ["business analysis", "business analyst", "requirements gathering", "brd", "frd", "use cases"], domain: "operations" },

  // ══════════════════════════════════════
  // ── SALES ──
  // ══════════════════════════════════════
  { name: "Sales", aliases: ["sales", "b2b sales", "b2c sales", "enterprise sales", "inside sales", "field sales"], domain: "sales" },
  { name: "Business Development", aliases: ["business development", "bd", "biz dev", "new business", "lead generation"], domain: "sales" },
  { name: "Key Account Management", aliases: ["key account management", "kam", "account management", "client servicing"], domain: "sales" },
  { name: "Salesforce", aliases: ["salesforce", "sfdc", "salesforce crm"], domain: "sales" },
  { name: "Cold Calling", aliases: ["cold calling", "outbound sales", "telemarketing"], domain: "sales" },
  { name: "Negotiation", aliases: ["negotiation", "deal closing", "contract negotiation"], domain: "sales" },
  { name: "Channel Sales", aliases: ["channel sales", "distributor management", "dealer management"], domain: "sales" },
  { name: "Retail Sales", aliases: ["retail sales", "retail management", "store management"], domain: "sales" },

  // ══════════════════════════════════════
  // ── OFFICE & PRODUCTIVITY ──
  // ══════════════════════════════════════
  { name: "Microsoft Office", aliases: ["ms office", "microsoft office", "office 365", "ms word", "microsoft word", "ms powerpoint", "powerpoint", "microsoft powerpoint"], domain: "general" },
  { name: "Google Workspace", aliases: ["google workspace", "google docs", "google sheets", "google slides", "gsuite", "g suite"], domain: "general" },
  { name: "Data Entry", aliases: ["data entry", "data management", "database management"], domain: "general" },
  { name: "Report Writing", aliases: ["report writing", "documentation", "technical writing", "business writing"], domain: "general" },
  { name: "Research", aliases: ["research", "desk research", "secondary research", "primary research", "literature review"], domain: "general" },

  // ══════════════════════════════════════
  // ── SOFT SKILLS ──
  // ══════════════════════════════════════
  { name: "Leadership", aliases: ["leadership", "team leadership", "people management", "managing teams"], domain: "soft" },
  { name: "Communication", aliases: ["communication skills", "verbal communication", "written communication", "public speaking", "presentation skills"], domain: "soft" },
  { name: "Teamwork", aliases: ["teamwork", "team player", "collaboration", "cross-functional teams"], domain: "soft" },
  { name: "Problem Solving", aliases: ["problem solving", "critical thinking", "analytical skills", "analytical thinking"], domain: "soft" },
  { name: "Time Management", aliases: ["time management", "multitasking", "prioritization", "deadline management"], domain: "soft" },
  { name: "Creativity", aliases: ["creativity", "creative thinking", "innovation", "ideation"], domain: "soft" },
  { name: "Adaptability", aliases: ["adaptability", "flexibility", "adaptable"], domain: "soft" },
  { name: "Attention to Detail", aliases: ["attention to detail", "detail-oriented", "accuracy"], domain: "soft" },
  { name: "Customer Service", aliases: ["customer service", "customer support", "client relations", "client management"], domain: "soft" },
  { name: "Decision Making", aliases: ["decision making", "strategic thinking", "strategic planning"], domain: "soft" },
  { name: "Conflict Resolution", aliases: ["conflict resolution", "conflict management", "mediation"], domain: "soft" },
  { name: "Mentoring", aliases: ["mentoring", "coaching", "guiding", "mentorship"], domain: "soft" },

  // ══════════════════════════════════════
  // ── LANGUAGES ──
  // ══════════════════════════════════════
  { name: "English", aliases: ["english", "english communication", "business english", "english proficiency"], domain: "language" },
  { name: "Hindi", aliases: ["hindi", "hindi communication"], domain: "language" },
];

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Universal resume skill extractor.
 * Matches skills from ALL domains — Tech, Design, Marketing, Finance, HR,
 * Operations, Sales, Soft Skills, and more. Works for any career background.
 */
export function extractSkills(text: string): { name: string; level: number }[] {
  if (!text) return [];

  const normalizedText = text.toLowerCase().replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ");
  const matchedSkills: Set<string> = new Set();

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

  return Array.from(matchedSkills).map(name => ({
    name,
    level: 80,
  }));
}
