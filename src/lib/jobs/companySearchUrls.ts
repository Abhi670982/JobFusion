export interface CompanyCareerSite {
  name: string;
  atsType: "greenhouse" | "lever" | "ashby" | "smartrecruiters" | "recruitee";
  slug: string;
  category?: string;
}

export const companies: CompanyCareerSite[] = [
  // ── GREENHOUSE API COMPANIES (VERIFIED WORKING) ──────────────────────────
  { name: "Airbnb", atsType: "greenhouse", slug: "airbnb", category: "Travel/Tech" },
  { name: "Stripe", atsType: "greenhouse", slug: "stripe", category: "Fintech" },
  { name: "Figma", atsType: "greenhouse", slug: "figma", category: "Design/SaaS" },
  { name: "Vercel", atsType: "greenhouse", slug: "vercel", category: "Dev Tools" },
  { name: "Datadog", atsType: "greenhouse", slug: "datadog", category: "Monitoring" },
  { name: "MongoDB", atsType: "greenhouse", slug: "mongodb", category: "Databases" },
  { name: "Twilio", atsType: "greenhouse", slug: "twilio", category: "API/Communications" },
  { name: "Cloudflare", atsType: "greenhouse", slug: "cloudflare", category: "Security/CDN" },
  { name: "PhonePe", atsType: "greenhouse", slug: "phonepe", category: "Fintech/India" },
  { name: "Dropbox", atsType: "greenhouse", slug: "dropbox", category: "SaaS/Storage" },
  { name: "Coinbase", atsType: "greenhouse", slug: "coinbase", category: "Crypto/Fintech" },
  { name: "Databricks", atsType: "greenhouse", slug: "databricks", category: "AI/Data" },
  { name: "Lyft", atsType: "greenhouse", slug: "lyft", category: "Ride Sharing" },
  { name: "Anthropic", atsType: "greenhouse", slug: "anthropic", category: "AI" },
  { name: "Pinterest", atsType: "greenhouse", slug: "pinterest", category: "Social Media" },
  { name: "HubSpot", atsType: "greenhouse", slug: "hubspot", category: "SaaS/Marketing" },
  { name: "Okta", atsType: "greenhouse", slug: "okta", category: "Identity" },
  { name: "Affirm", atsType: "greenhouse", slug: "affirm", category: "Fintech/BNPL" },
  { name: "Gusto", atsType: "greenhouse", slug: "gusto", category: "HR Tech" },
  { name: "Instacart", atsType: "greenhouse", slug: "instacart", category: "Delivery" },
  { name: "Reddit", atsType: "greenhouse", slug: "reddit", category: "Social Media" },
  { name: "Robinhood", atsType: "greenhouse", slug: "robinhood", category: "Fintech" },
  { name: "Asana", atsType: "greenhouse", slug: "asana", category: "Productivity" },
  { name: "GitLab", atsType: "greenhouse", slug: "gitlab", category: "Dev Tools" },
  { name: "Postman", atsType: "greenhouse", slug: "postman", category: "Dev Tools" },
  { name: "Elastic", atsType: "greenhouse", slug: "elastic", category: "Search" },
  { name: "PagerDuty", atsType: "greenhouse", slug: "pagerduty", category: "Dev Tools" },
  { name: "Groww", atsType: "greenhouse", slug: "groww", category: "Fintech/India" },
  { name: "Scale AI", atsType: "greenhouse", slug: "scaleai", category: "AI/Data" },
  { name: "Tailscale", atsType: "greenhouse", slug: "tailscale", category: "Security" },
  { name: "CircleCI", atsType: "greenhouse", slug: "circleci", category: "Dev Tools" },

  // ── LEVER API COMPANIES (VERIFIED WORKING) ───────────────────────────────
  { name: "Netflix", atsType: "lever", slug: "netflix", category: "Streaming/Entertainment" },
  { name: "Spotify", atsType: "lever", slug: "spotify", category: "Music/Streaming" },
  { name: "Freshworks", atsType: "lever", slug: "freshworks", category: "SaaS/India" },
  { name: "Lever", atsType: "lever", slug: "lever", category: "HR Tech" },
  { name: "Hotstar", atsType: "lever", slug: "hotstar", category: "Streaming/India" },
  { name: "Medium", atsType: "lever", slug: "medium", category: "Publishing" },
  { name: "15Five", atsType: "lever", slug: "15five", category: "HR Tech" },
  { name: "Palantir", atsType: "lever", slug: "palantir", category: "Data Analytics" },

  // ── ASHBY API COMPANIES (VERIFIED WORKING) ───────────────────────────────
  { name: "OpenAI", atsType: "ashby", slug: "openai", category: "AI" },
  { name: "Notion", atsType: "ashby", slug: "notion", category: "Productivity" },
  { name: "Ramp", atsType: "ashby", slug: "ramp", category: "Fintech" },
  { name: "Linear", atsType: "ashby", slug: "linear", category: "Productivity" },
  { name: "Cursor", atsType: "ashby", slug: "cursor", category: "AI/Dev Tools" },
  { name: "Deel", atsType: "ashby", slug: "deel", category: "HR Tech/Fintech" },
  { name: "PostHog", atsType: "ashby", slug: "posthog", category: "Analytics" },
  { name: "Vanta", atsType: "ashby", slug: "vanta", category: "Compliance" },
  { name: "Confluent", atsType: "ashby", slug: "confluent", category: "Data Streaming" },
  { name: "Snowflake", atsType: "ashby", slug: "snowflake", category: "Data Warehouse" },
  { name: "ElevenLabs", atsType: "ashby", slug: "elevenlabs", category: "AI/Voice" },
  { name: "LangChain", atsType: "ashby", slug: "langchain", category: "AI/Dev Tools" },
  { name: "Pinecone", atsType: "ashby", slug: "pinecone", category: "Vector Databases" },
  { name: "Weaviate", atsType: "ashby", slug: "weaviate", category: "Vector Databases" },
  { name: "Temporal", atsType: "ashby", slug: "temporal", category: "Backend Orchestration" },
  { name: "Railway", atsType: "ashby", slug: "railway", category: "Cloud Hosting" },
  { name: "Clerk", atsType: "ashby", slug: "clerk", category: "Auth/Identity" },
  { name: "Resend", atsType: "ashby", slug: "resend", category: "Email API" },
  { name: "Neon", atsType: "ashby", slug: "neon", category: "Serverless Postgres" },

  // ── SMARTRECRUITERS COMPANIES (VERIFIED WORKING) ─────────────────────────
  { name: "Visa", atsType: "smartrecruiters", slug: "visa", category: "Fintech/Payments" },
  { name: "IKEA", atsType: "smartrecruiters", slug: "ikea", category: "Retail" },
  { name: "Bosch", atsType: "smartrecruiters", slug: "bosch", category: "Industrial/Hardware" },
  { name: "Equinix", atsType: "smartrecruiters", slug: "equinix", category: "Data Centers" },
  { name: "Sanofi", atsType: "smartrecruiters", slug: "sanofi", category: "Pharma" },
  { name: "Ubisoft", atsType: "smartrecruiters", slug: "ubisoft", category: "Gaming" },
  { name: "Colliers", atsType: "smartrecruiters", slug: "colliers", category: "Real Estate" },
  { name: "Skechers", atsType: "smartrecruiters", slug: "skechers", category: "Retail" },

  // ── RECRUITEE COMPANIES (VERIFIED WORKING) ───────────────────────────────
  { name: "bunq", atsType: "recruitee", slug: "bunq", category: "Fintech" }
];
