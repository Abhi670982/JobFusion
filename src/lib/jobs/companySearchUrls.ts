// Company career page search URL patterns and API configurations
// Supports HTML scraping (static/dynamic) as well as Greenhouse and Lever JSON APIs

export interface CompanyCareerSite {
  name: string;
  baseUrl: string; // Used for resolving relative URLs
  searchUrl?: (skill: string) => string;
  crawlerType?: "static" | "dynamic";
  apiType?: "greenhouse" | "lever";
  apiIdentifier?: string; // board name for greenhouse, company name for lever
}

export const companies: CompanyCareerSite[] = [
  // ── GREENHOUSE API COMPLEMENTS ─────────────────────────────────────────────
  {
    name: "Vercel",
    baseUrl: "https://vercel.com",
    apiType: "greenhouse",
    apiIdentifier: "vercel",
  },

  {
    name: "Figma",
    baseUrl: "https://www.figma.com",
    apiType: "greenhouse",
    apiIdentifier: "figma",
  },
  {
    name: "Supabase",
    baseUrl: "https://supabase.com",
    apiType: "greenhouse",
    apiIdentifier: "supabase",
  },
  {
    name: "Airbnb",
    baseUrl: "https://careers.airbnb.com",
    apiType: "greenhouse",
    apiIdentifier: "airbnb",
  },
  {
    name: "Dropbox",
    baseUrl: "https://www.dropbox.com",
    apiType: "greenhouse",
    apiIdentifier: "dropbox",
  },
  {
    name: "Datadog",
    baseUrl: "https://www.datadoghq.com",
    apiType: "greenhouse",
    apiIdentifier: "datadog",
  },
  {
    name: "MongoDB",
    baseUrl: "https://www.mongodb.com",
    apiType: "greenhouse",
    apiIdentifier: "mongodb",
  },
  {
    name: "Twilio",
    baseUrl: "https://careers.twilio.com",
    apiType: "greenhouse",
    apiIdentifier: "twilio",
  },

  {
    name: "Cloudflare",
    baseUrl: "https://www.cloudflare.com",
    apiType: "greenhouse",
    apiIdentifier: "cloudflare",
  },

  {
    name: "PhonePe",
    baseUrl: "https://www.phonepe.com",
    apiType: "greenhouse",
    apiIdentifier: "phonepe",
  },


  // ── LEVER API COMPLEMENTS ──────────────────────────────────────────────────
  {
    name: "Netflix",
    baseUrl: "https://jobs.netflix.com",
    apiType: "lever",
    apiIdentifier: "netflix",
  },

  {
    name: "Freshworks",
    baseUrl: "https://www.freshworks.com",
    apiType: "lever",
    apiIdentifier: "freshworks",
  },

  // ── HTML SCRAPING & WORKDAY SITES ──────────────────────────────────────────
  {
    name: "Snowflake",
    baseUrl: "https://careers.snowflake.com",
    crawlerType: "dynamic",
    searchUrl: () => `https://careers.snowflake.com/`,
  },
  {
    name: "Razorpay",
    baseUrl: "https://razorpay.com",
    crawlerType: "dynamic",
    searchUrl: () => `https://razorpay.com/jobs/`,
  },
  {
    name: "Notion",
    baseUrl: "https://www.notion.so",
    crawlerType: "static",
    searchUrl: (skill: string) =>
      `https://www.notion.so/careers?search=${encodeURIComponent(skill)}`,
  },
  {
    name: "Linear",
    baseUrl: "https://linear.app",
    crawlerType: "static",
    searchUrl: () => `https://linear.app/careers`,
  },
  {
    name: "Swiggy",
    baseUrl: "https://careers.swiggy.com",
    crawlerType: "dynamic",
    searchUrl: () => `https://careers.swiggy.com/`,
  },
  {
    name: "Zomato",
    baseUrl: "https://www.zomato.com",
    crawlerType: "dynamic",
    searchUrl: () => `https://www.zomato.com/careers`,
  },
  {
    name: "CRED",
    baseUrl: "https://careers.cred.club",
    crawlerType: "dynamic",
    searchUrl: () => `https://careers.cred.club/`,
  },
  {
    name: "Juspay",
    baseUrl: "https://juspay.in",
    crawlerType: "dynamic",
    searchUrl: () => `https://juspay.in/careers`,
  },
  {
    name: "Meesho",
    baseUrl: "https://meesho.careers",
    crawlerType: "dynamic",
    searchUrl: () => `https://meesho.careers/`,
  },
  {
    name: "Google",
    baseUrl: "https://www.google.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://www.google.com/about/careers/applications/jobs/results/?q=${encodeURIComponent(skill)}&target_level=EARLY&target_level=MID&target_level=ADVANCED`,
  },
  {
    name: "Stripe",
    baseUrl: "https://stripe.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://stripe.com/jobs/search?query=${encodeURIComponent(skill)}`,
  },
  {
    name: "Shopify",
    baseUrl: "https://www.shopify.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://www.shopify.com/careers/search?keywords=${encodeURIComponent(skill)}`,
  },
  {
    name: "Microsoft",
    baseUrl: "https://careers.microsoft.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://careers.microsoft.com/v2/global/en/search.html?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "Amazon",
    baseUrl: "https://www.amazon.jobs",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://www.amazon.jobs/en/search?base_query=${encodeURIComponent(skill)}`,
  },
  {
    name: "Apple",
    baseUrl: "https://jobs.apple.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://jobs.apple.com/en-us/search?search=${encodeURIComponent(skill)}`,
  },
  {
    name: "Meta",
    baseUrl: "https://www.metacareers.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://www.metacareers.com/jobs/?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "Adobe",
    baseUrl: "https://adobe.wd5.myworkdayjobs.com",
    crawlerType: "static",
    searchUrl: (skill: string) =>
      `https://adobe.wd5.myworkdayjobs.com/external_careers?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "Salesforce",
    baseUrl: "https://salesforce.wd1.myworkdayjobs.com",
    crawlerType: "static",
    searchUrl: (skill: string) =>
      `https://salesforce.wd1.myworkdayjobs.com/External_Career_Site?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "Oracle",
    baseUrl: "https://careers.oracle.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://careers.oracle.com/jobs/?search=${encodeURIComponent(skill)}`,
  },
  {
    name: "SAP",
    baseUrl: "https://jobs.sap.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://jobs.sap.com/search/?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "IBM",
    baseUrl: "https://www.ibm.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://www.ibm.com/careers/search?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "Intel",
    baseUrl: "https://jobs.intel.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://jobs.intel.com/en/search-jobs/${encodeURIComponent(skill)}`,
  },
  {
    name: "NVIDIA",
    baseUrl: "https://nvidia.wd5.myworkdayjobs.com",
    crawlerType: "static",
    searchUrl: (skill: string) =>
      `https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "AMD",
    baseUrl: "https://careers.amd.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://careers.amd.com/jobs/search?query=${encodeURIComponent(skill)}`,
  },
  {
    name: "Cisco",
    baseUrl: "https://jobs.cisco.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://jobs.cisco.com/jobs/SearchJobs/${encodeURIComponent(skill)}`,
  },
  {
    name: "Atlassian",
    baseUrl: "https://www.atlassian.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://www.atlassian.com/company/careers/all-jobs?search=${encodeURIComponent(skill)}`,
  },
  {
    name: "GitHub",
    baseUrl: "https://github.com",
    crawlerType: "static",
    searchUrl: (skill: string) =>
      `https://github.com/about/careers?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "Uber",
    baseUrl: "https://www.uber.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://www.uber.com/global/en/careers/list/?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "LinkedIn",
    baseUrl: "https://www.linkedin.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://www.linkedin.com/careers/search?keywords=${encodeURIComponent(skill)}`,
  },
  {
    name: "PayPal",
    baseUrl: "https://paypal.wd1.myworkdayjobs.com",
    crawlerType: "static",
    searchUrl: (skill: string) =>
      `https://paypal.wd1.myworkdayjobs.com/jobs?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "Spotify",
    baseUrl: "https://www.lifeatspotify.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://www.lifeatspotify.com/jobs?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "ServiceNow",
    baseUrl: "https://careers.servicenow.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://careers.servicenow.com/jobs/?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "TCS",
    baseUrl: "https://www.tcs.com",
    crawlerType: "dynamic",
    searchUrl: () => `https://www.tcs.com/careers`,
  },
  {
    name: "Infosys",
    baseUrl: "https://career.infosys.com",
    crawlerType: "dynamic",
    searchUrl: () => `https://career.infosys.com/`,
  },
  {
    name: "Wipro",
    baseUrl: "https://careers.wipro.com",
    crawlerType: "dynamic",
    searchUrl: () => `https://careers.wipro.com/`,
  },
  {
    name: "HCLTech",
    baseUrl: "https://www.hcltech.com",
    crawlerType: "dynamic",
    searchUrl: () => `https://www.hcltech.com/careers`,
  },
  {
    name: "Tech Mahindra",
    baseUrl: "https://careers.techmahindra.com",
    crawlerType: "dynamic",
    searchUrl: () => `https://careers.techmahindra.com/`,
  },
  {
    name: "Accenture",
    baseUrl: "https://www.accenture.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://www.accenture.com/in-en/careers/jobsearch?jk=${encodeURIComponent(skill)}`,
  },
  {
    name: "Capgemini",
    baseUrl: "https://www.capgemini.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://www.capgemini.com/careers/job-search/?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "Cognizant",
    baseUrl: "https://careers.cognizant.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://careers.cognizant.com/global/en/search-results?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "Deloitte",
    baseUrl: "https://jobsindia.deloitte.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://jobsindia.deloitte.com/search/?q=${encodeURIComponent(skill)}`,
  },
  {
    name: "PwC",
    baseUrl: "https://jobs.us.pwc.com",
    crawlerType: "dynamic",
    searchUrl: (skill: string) =>
      `https://jobs.us.pwc.com/search-jobs/${encodeURIComponent(skill)}`,
  },
  {
    name: "Zoho",
    baseUrl: "https://www.zoho.com",
    crawlerType: "static",
    searchUrl: () => `https://www.zoho.com/careers/jobs.html`,
  },
  {
    name: "Flipkart",
    baseUrl: "https://www.flipkartcareers.com",
    crawlerType: "dynamic",
    searchUrl: () => `https://www.flipkartcareers.com/jobs`,
  },
];
