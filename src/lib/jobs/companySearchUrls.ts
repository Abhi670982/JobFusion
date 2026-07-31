export type ATSType = 
  | "greenhouse" 
  | "lever" 
  | "ashby" 
  | "smartrecruiters" 
  | "recruitee" 
  | "workday" 
  | "custom" 
  | "unknown";

export interface CompanySource {
  id: string;
  company: string;
  careersUrl: string;
  atsType: ATSType;
  slug?: string;
  jobsEndpoint?: string;
  country: "IN";
  enabled: boolean;
  priority: "P0" | "P1" | "P2" | "P3";
  category?: string;
  lastSuccessfulCrawlAt?: Date | null;
  lastFullReconciliationAt?: Date | null;
  consecutiveFailures?: number;
  nextAllowedCrawlAt?: Date | null;
}

// Backwards compatibility alias
export type CompanyCareerSite = CompanySource;

export const companies: CompanySource[] = [
  // P0 - Top Global Tech MNCs & Large Product Companies with Verified Public ATS
  { id: "airbnb", company: "Airbnb", careersUrl: "https://careers.airbnb.com/", atsType: "greenhouse", slug: "airbnb", country: "IN", enabled: true, priority: "P0", category: "Travel/Tech" },
  { id: "stripe", company: "Stripe", careersUrl: "https://stripe.com/jobs", atsType: "greenhouse", slug: "stripe", country: "IN", enabled: true, priority: "P0", category: "Fintech" },
  { id: "figma", company: "Figma", careersUrl: "https://www.figma.com/careers/", atsType: "greenhouse", slug: "figma", country: "IN", enabled: true, priority: "P0", category: "Design/SaaS" },
  { id: "vercel", company: "Vercel", careersUrl: "https://vercel.com/careers", atsType: "greenhouse", slug: "vercel", country: "IN", enabled: true, priority: "P0", category: "Dev Tools" },
  { id: "datadog", company: "Datadog", careersUrl: "https://careers.datadoghq.com/", atsType: "greenhouse", slug: "datadog", country: "IN", enabled: true, priority: "P0", category: "Monitoring" },
  { id: "mongodb", company: "MongoDB", careersUrl: "https://www.mongodb.com/company/careers", atsType: "greenhouse", slug: "mongodb", country: "IN", enabled: true, priority: "P0", category: "Databases" },
  { id: "twilio", company: "Twilio", careersUrl: "https://www.twilio.com/company/jobs", atsType: "greenhouse", slug: "twilio", country: "IN", enabled: true, priority: "P0", category: "API/Communications" },
  { id: "cloudflare", company: "Cloudflare", careersUrl: "https://www.cloudflare.com/careers/", atsType: "greenhouse", slug: "cloudflare", country: "IN", enabled: true, priority: "P0", category: "Security/CDN" },
  { id: "uber", company: "Uber", careersUrl: "https://www.uber.com/careers/", atsType: "smartrecruiters", slug: "uber", country: "IN", enabled: true, priority: "P0", category: "Rideshare/Tech" },
  { id: "servicenow", company: "ServiceNow", careersUrl: "https://careers.servicenow.com/", atsType: "smartrecruiters", slug: "servicenow", country: "IN", enabled: true, priority: "P0", category: "Enterprise SaaS" },
  { id: "openai", company: "OpenAI", careersUrl: "https://openai.com/careers", atsType: "ashby", slug: "openai", country: "IN", enabled: true, priority: "P0", category: "AI" },
  { id: "notion", company: "Notion", careersUrl: "https://www.notion.so/careers", atsType: "ashby", slug: "notion", country: "IN", enabled: true, priority: "P0", category: "Productivity" },
  { id: "confluent", company: "Confluent", careersUrl: "https://www.confluent.io/careers/", atsType: "ashby", slug: "confluent", country: "IN", enabled: true, priority: "P0", category: "Data Streaming" },
  { id: "snowflake", company: "Snowflake", careersUrl: "https://careers.snowflake.com/", atsType: "ashby", slug: "snowflake", country: "IN", enabled: true, priority: "P0", category: "Data Warehouse" },
  { id: "databricks", company: "Databricks", careersUrl: "https://www.databricks.com/company/careers", atsType: "greenhouse", slug: "databricks", country: "IN", enabled: true, priority: "P0", category: "AI/Data" },
  { id: "elastic", company: "Elastic", careersUrl: "https://www.elastic.co/about/careers", atsType: "greenhouse", slug: "elastic", country: "IN", enabled: true, priority: "P0", category: "Search/Data" },
  { id: "gitlab", company: "GitLab", careersUrl: "https://about.gitlab.com/jobs/", atsType: "greenhouse", slug: "gitlab", country: "IN", enabled: true, priority: "P0", category: "Dev Tools" },
  { id: "postman", company: "Postman", careersUrl: "https://www.postman.com/company/careers/", atsType: "greenhouse", slug: "postman", country: "IN", enabled: true, priority: "P0", category: "Dev Tools" },
  { id: "zscaler", company: "Zscaler", careersUrl: "https://www.zscaler.com/careers", atsType: "greenhouse", slug: "zscaler", country: "IN", enabled: true, priority: "P0", category: "Security" },
  { id: "okta", company: "Okta", careersUrl: "https://www.okta.com/company/careers/", atsType: "greenhouse", slug: "okta", country: "IN", enabled: true, priority: "P0", category: "Identity" },

  // P1 - Verified Indian Tech Unicorns, High-Growth SaaS & Product Employers
  { id: "phonepe", company: "PhonePe", careersUrl: "https://www.phonepe.com/careers/", atsType: "greenhouse", slug: "phonepe", country: "IN", enabled: true, priority: "P1", category: "Fintech/India" },
  { id: "cred", company: "CRED", careersUrl: "https://careers.cred.club/", atsType: "lever", slug: "cred", country: "IN", enabled: true, priority: "P1", category: "Fintech/India" },
  { id: "meesho", company: "Meesho", careersUrl: "https://www.meesho.io/jobs", atsType: "lever", slug: "meesho", country: "IN", enabled: true, priority: "P1", category: "E-Commerce/India" },
  { id: "swiggy", company: "Swiggy", careersUrl: "https://careers.swiggy.com/", atsType: "smartrecruiters", slug: "swiggy", country: "IN", enabled: true, priority: "P1", category: "FoodTech/India" },
  { id: "groww", company: "Groww", careersUrl: "https://groww.in/careers", atsType: "greenhouse", slug: "groww", country: "IN", enabled: true, priority: "P1", category: "Fintech/India" },
  { id: "pinelabs", company: "Pine Labs", careersUrl: "https://www.pinelabs.com/careers", atsType: "greenhouse", slug: "pine", country: "IN", enabled: true, priority: "P1", category: "Fintech/India" },
  { id: "inmobi", company: "InMobi", careersUrl: "https://www.inmobi.com/company/careers", atsType: "greenhouse", slug: "inmobi", country: "IN", enabled: true, priority: "P1", category: "AdTech/India" },
  { id: "highradius", company: "HighRadius", careersUrl: "https://www.highradius.com/careers/", atsType: "greenhouse", slug: "highradius", country: "IN", enabled: true, priority: "P1", category: "Fintech/SaaS" },
  { id: "freshworks", company: "Freshworks", careersUrl: "https://www.freshworks.com/company/careers/", atsType: "lever", slug: "freshworks", country: "IN", enabled: true, priority: "P1", category: "SaaS/India" },
  { id: "visa", company: "Visa", careersUrl: "https://corporate.visa.com/en/careers.html", atsType: "smartrecruiters", slug: "visa", country: "IN", enabled: true, priority: "P1", category: "Payments" },
  { id: "canva", company: "Canva", careersUrl: "https://www.canva.com/careers/", atsType: "smartrecruiters", slug: "canva", country: "IN", enabled: true, priority: "P1", category: "Design/SaaS" },

  // P1 - Global Infrastructure, Cloud & Developer Tools with Verified ATS
  { id: "docker", company: "Docker", careersUrl: "https://www.docker.com/careers/", atsType: "ashby", slug: "docker", country: "IN", enabled: true, priority: "P1", category: "Dev Tools" },
  { id: "grafana", company: "Grafana Labs", careersUrl: "https://grafana.com/about/careers/", atsType: "greenhouse", slug: "grafanalabs", country: "IN", enabled: true, priority: "P1", category: "Dev Tools" },
  { id: "sentry", company: "Sentry", careersUrl: "https://sentry.io/careers/", atsType: "ashby", slug: "sentry", country: "IN", enabled: true, priority: "P1", category: "Monitoring" },
  { id: "linear", company: "Linear", careersUrl: "https://linear.app/careers", atsType: "ashby", slug: "linear", country: "IN", enabled: true, priority: "P1", category: "Dev Tools" },
  { id: "ramp", company: "Ramp", careersUrl: "https://ramp.com/careers", atsType: "ashby", slug: "ramp", country: "IN", enabled: true, priority: "P1", category: "Fintech" },
  { id: "brex", company: "Brex", careersUrl: "https://www.brex.com/careers", atsType: "greenhouse", slug: "brex", country: "IN", enabled: true, priority: "P1", category: "Fintech" },
  { id: "robinhood", company: "Robinhood", careersUrl: "https://robinhood.com/us/en/about-us/careers/", atsType: "greenhouse", slug: "robinhood", country: "IN", enabled: true, priority: "P1", category: "Fintech" },
  { id: "coinbase", company: "Coinbase", careersUrl: "https://www.coinbase.com/careers", atsType: "greenhouse", slug: "coinbase", country: "IN", enabled: true, priority: "P1", category: "Crypto/Fintech" },
  { id: "chime", company: "Chime", careersUrl: "https://www.chime.com/careers/", atsType: "greenhouse", slug: "chime", country: "IN", enabled: true, priority: "P1", category: "Fintech" },
  { id: "affirm", company: "Affirm", careersUrl: "https://www.affirm.com/careers", atsType: "greenhouse", slug: "affirm", country: "IN", enabled: true, priority: "P1", category: "Fintech" },
  { id: "toast", company: "Toast", careersUrl: "https://pos.toasttab.com/careers", atsType: "greenhouse", slug: "toast", country: "IN", enabled: true, priority: "P1", category: "SaaS/Payments" },
  { id: "instacart", company: "Instacart", careersUrl: "https://instacart.careers/", atsType: "greenhouse", slug: "instacart", country: "IN", enabled: true, priority: "P1", category: "Delivery/Tech" },
  { id: "lyft", company: "Lyft", careersUrl: "https://www.lyft.com/careers", atsType: "greenhouse", slug: "lyft", country: "IN", enabled: true, priority: "P1", category: "Rideshare/Tech" },
  { id: "pinterest", company: "Pinterest", careersUrl: "https://www.pinterestcareers.com/", atsType: "greenhouse", slug: "pinterest", country: "IN", enabled: true, priority: "P1", category: "Social" },
  { id: "reddit", company: "Reddit", careersUrl: "https://www.redditinc.com/careers", atsType: "greenhouse", slug: "reddit", country: "IN", enabled: true, priority: "P1", category: "Social" },
  { id: "discord", company: "Discord", careersUrl: "https://discord.com/careers", atsType: "greenhouse", slug: "discord", country: "IN", enabled: true, priority: "P1", category: "Social/Gaming" },
  { id: "roblox", company: "Roblox", careersUrl: "https://careers.roblox.com/", atsType: "greenhouse", slug: "roblox", country: "IN", enabled: true, priority: "P1", category: "Gaming" },
  { id: "duolingo", company: "Duolingo", careersUrl: "https://careers.duolingo.com/", atsType: "greenhouse", slug: "duolingo", country: "IN", enabled: true, priority: "P1", category: "EdTech" },
  { id: "epicgames", company: "Epic Games", careersUrl: "https://www.epicgames.com/site/en-US/careers", atsType: "greenhouse", slug: "epicgames", country: "IN", enabled: true, priority: "P1", category: "Gaming" },
  { id: "newrelic", company: "New Relic", careersUrl: "https://newrelic.com/about/careers", atsType: "greenhouse", slug: "newrelic", country: "IN", enabled: true, priority: "P1", category: "Monitoring" },
  { id: "sumologic", company: "Sumo Logic", careersUrl: "https://www.sumologic.com/careers/", atsType: "greenhouse", slug: "sumologic", country: "IN", enabled: true, priority: "P1", category: "Analytics" },
  { id: "pagerduty", company: "PagerDuty", careersUrl: "https://www.pagerduty.com/careers/", atsType: "greenhouse", slug: "pagerduty", country: "IN", enabled: true, priority: "P1", category: "Operations" },
  { id: "fastly", company: "Fastly", careersUrl: "https://www.fastly.com/careers", atsType: "greenhouse", slug: "fastly", country: "IN", enabled: true, priority: "P1", category: "CDN/Edge" },
  { id: "purestorage", company: "Pure Storage", careersUrl: "https://www.purestorage.com/company/careers.html", atsType: "greenhouse", slug: "purestorage", country: "IN", enabled: true, priority: "P1", category: "Data Hardware" },
  { id: "cribl", company: "Cribl", careersUrl: "https://cribl.io/careers/", atsType: "greenhouse", slug: "cribl", country: "IN", enabled: true, priority: "P1", category: "Data Engine" },
  { id: "rubrik", company: "Rubrik", careersUrl: "https://www.rubrik.com/company/careers", atsType: "greenhouse", slug: "rubrik", country: "IN", enabled: true, priority: "P1", category: "Data Security" },
  { id: "thoughtworks", company: "Thoughtworks", careersUrl: "https://www.thoughtworks.com/careers", atsType: "greenhouse", slug: "thoughtworks", country: "IN", enabled: true, priority: "P1", category: "Consulting/Tech" },
  { id: "100ms", company: "100ms", careersUrl: "https://www.100ms.live/careers", atsType: "lever", slug: "100ms", country: "IN", enabled: true, priority: "P1", category: "Video/Dev Tools" },
  { id: "zeta", company: "Zeta", careersUrl: "https://zetaglobal.com/careers/", atsType: "greenhouse", slug: "zetaglobal", country: "IN", enabled: true, priority: "P1", category: "Fintech/SaaS" },

  // P2 - Verified High-Growth AI & Next-Gen Database Infrastructure Employers
  { id: "clickhouse", company: "ClickHouse", careersUrl: "https://clickhouse.com/company/careers", atsType: "greenhouse", slug: "clickhouse", country: "IN", enabled: true, priority: "P2", category: "Databases" },
  { id: "singlestore", company: "SingleStore", careersUrl: "https://www.singlestore.com/careers/", atsType: "greenhouse", slug: "singlestore", country: "IN", enabled: true, priority: "P2", category: "Databases" },
  { id: "cockroachlabs", company: "Cockroach Labs", careersUrl: "https://www.cockroachlabs.com/careers/", atsType: "greenhouse", slug: "cockroachlabs", country: "IN", enabled: true, priority: "P2", category: "Databases" },
  { id: "yugabyte", company: "Yugabyte", careersUrl: "https://www.yugabyte.com/careers/", atsType: "greenhouse", slug: "yugabyte", country: "IN", enabled: true, priority: "P2", category: "Databases" },
  { id: "supabase", company: "Supabase", careersUrl: "https://supabase.com/careers", atsType: "ashby", slug: "supabase", country: "IN", enabled: true, priority: "P2", category: "Databases/Dev Tools" },
  { id: "planetscale", company: "PlanetScale", careersUrl: "https://planetscale.com/careers", atsType: "greenhouse", slug: "planetscale", country: "IN", enabled: true, priority: "P2", category: "Databases" },
  { id: "neo4j", company: "Neo4j", careersUrl: "https://neo4j.com/careers/", atsType: "greenhouse", slug: "neo4j", country: "IN", enabled: true, priority: "P2", category: "Databases" },
  { id: "pinecone", company: "Pinecone", careersUrl: "https://www.pinecone.io/careers/", atsType: "ashby", slug: "pinecone", country: "IN", enabled: true, priority: "P2", category: "AI/Vector DB" },
  { id: "weaviate", company: "Weaviate", careersUrl: "https://weaviate.io/careers", atsType: "ashby", slug: "weaviate", country: "IN", enabled: true, priority: "P2", category: "AI/Vector DB" },
  { id: "trychroma", company: "Chroma", careersUrl: "https://www.trychroma.com/careers", atsType: "ashby", slug: "trychroma", country: "IN", enabled: true, priority: "P2", category: "AI/Vector DB" },
  { id: "scaleai", company: "Scale AI", careersUrl: "https://scale.com/careers", atsType: "greenhouse", slug: "scaleai", country: "IN", enabled: true, priority: "P2", category: "AI" },
  { id: "anthropic", company: "Anthropic", careersUrl: "https://www.anthropic.com/careers", atsType: "greenhouse", slug: "anthropic", country: "IN", enabled: true, priority: "P2", category: "AI" },
  { id: "cohere", company: "Cohere", careersUrl: "https://cohere.com/careers", atsType: "ashby", slug: "cohere", country: "IN", enabled: true, priority: "P2", category: "AI" },
  { id: "midjourney", company: "Midjourney", careersUrl: "https://www.midjourney.com/careers", atsType: "ashby", slug: "midjourney", country: "IN", enabled: true, priority: "P2", category: "AI" },
  { id: "perplexity", company: "Perplexity", careersUrl: "https://www.perplexity.ai/careers", atsType: "ashby", slug: "perplexity", country: "IN", enabled: true, priority: "P2", category: "AI Search" },
  { id: "cursor", company: "Cursor / Anysphere", careersUrl: "https://www.cursor.com/careers", atsType: "ashby", slug: "cursor", country: "IN", enabled: true, priority: "P2", category: "AI/Dev Tools" },
  { id: "replit", company: "Replit", careersUrl: "https://replit.com/site/careers", atsType: "ashby", slug: "replit", country: "IN", enabled: true, priority: "P2", category: "Dev Tools" },
  { id: "modal", company: "Modal", careersUrl: "https://modal.com/careers", atsType: "ashby", slug: "modal", country: "IN", enabled: true, priority: "P2", category: "AI Infrastructure" },
  { id: "braintrust", company: "Braintrust", careersUrl: "https://www.braintrust.dev/careers", atsType: "ashby", slug: "braintrust", country: "IN", enabled: true, priority: "P2", category: "AI Infrastructure" },
  { id: "langchain", company: "LangChain", careersUrl: "https://www.langchain.com/careers", atsType: "ashby", slug: "langchain", country: "IN", enabled: true, priority: "P2", category: "AI Framework" },
  { id: "llamaindex", company: "LlamaIndex", careersUrl: "https://www.llamaindex.ai/careers", atsType: "ashby", slug: "llamaindex", country: "IN", enabled: true, priority: "P2", category: "AI Framework" },

  // Big Tech / Enterprise / IT Majors with Custom or Unsupported ATS APIs (Tracked as UNSUPPORTED until structured API endpoints exist)
  { id: "google", company: "Google", careersUrl: "https://www.google.com/about/careers/applications/", atsType: "unknown", slug: "google", country: "IN", enabled: true, priority: "P3", category: "Big Tech" },
  { id: "microsoft", company: "Microsoft", careersUrl: "https://careers.microsoft.com/", atsType: "unknown", slug: "microsoft", country: "IN", enabled: true, priority: "P3", category: "Big Tech" },
  { id: "amazon", company: "Amazon", careersUrl: "https://www.amazon.jobs/", atsType: "unknown", slug: "amazon", country: "IN", enabled: true, priority: "P3", category: "Big Tech" },
  { id: "apple", company: "Apple", careersUrl: "https://jobs.apple.com/", atsType: "unknown", slug: "apple", country: "IN", enabled: true, priority: "P3", category: "Big Tech" },
  { id: "meta", company: "Meta", careersUrl: "https://www.metacareers.com/", atsType: "unknown", slug: "meta", country: "IN", enabled: true, priority: "P3", category: "Big Tech" },
  { id: "tcs", company: "TCS", careersUrl: "https://www.tcs.com/careers", atsType: "unknown", slug: "tcs", country: "IN", enabled: true, priority: "P3", category: "IT Services" },
  { id: "infosys", company: "Infosys", careersUrl: "https://www.infosys.com/careers/", atsType: "unknown", slug: "infosys", country: "IN", enabled: true, priority: "P3", category: "IT Services" },
  { id: "wipro", company: "Wipro", careersUrl: "https://careers.wipro.com/", atsType: "unknown", slug: "wipro", country: "IN", enabled: true, priority: "P3", category: "IT Services" },
  { id: "hcltech", company: "HCLTech", careersUrl: "https://www.hcltech.com/careers", atsType: "unknown", slug: "hcltech", country: "IN", enabled: true, priority: "P3", category: "IT Services" },
];
