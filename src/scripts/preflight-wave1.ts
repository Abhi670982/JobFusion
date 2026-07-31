import {
  fetchGreenhouseJobs,
  fetchLeverJobs,
  fetchAshbyJobs,
  fetchSmartRecruitersJobs,
  fetchRecruiteeJobs,
  RawATSJob,
} from '../lib/adapters/ats-apis';

interface CandidateCompany {
  company: string;
  atsType: 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters' | 'recruitee';
  slug: string;
  careersUrl: string;
  category: string;
}

const candidates: CandidateCompany[] = [
  // Greenhouse
  { company: 'Atlassian', atsType: 'greenhouse', slug: 'atlassian', careersUrl: 'https://careers.atlassian.com/', category: 'Dev Tools' },
  { company: 'DoorDash', atsType: 'greenhouse', slug: 'doordash', careersUrl: 'https://careers.doordash.com/', category: 'Delivery/Tech' },
  { company: 'Rippling', atsType: 'greenhouse', slug: 'rippling', careersUrl: 'https://www.rippling.com/careers', category: 'HR/Fintech' },
  { company: 'Zendesk', atsType: 'greenhouse', slug: 'zendesk', careersUrl: 'https://www.zendesk.com/careers/', category: 'SaaS' },
  { company: 'Splunk', atsType: 'greenhouse', slug: 'splunk', careersUrl: 'https://www.splunk.com/en_us/careers.html', category: 'Security/Data' },
  { company: 'Thoughtworks', atsType: 'greenhouse', slug: 'thoughtworks', careersUrl: 'https://www.thoughtworks.com/careers', category: 'Consulting/Tech' },
  { company: 'ThoughtSpot', atsType: 'greenhouse', slug: 'thoughtspot', careersUrl: 'https://www.thoughtspot.com/careers', category: 'Analytics' },
  { company: 'Rubrik', atsType: 'greenhouse', slug: 'rubrik', careersUrl: 'https://www.rubrik.com/company/careers', category: 'Data Security' },
  { company: 'Cohesity', atsType: 'greenhouse', slug: 'cohesity', careersUrl: 'https://www.cohesity.com/company/careers/', category: 'Data Security' },
  { company: 'BrowserStack', atsType: 'greenhouse', slug: 'browserstack', careersUrl: 'https://www.browserstack.com/careers', category: 'Dev Tools' },
  { company: 'Plivo', atsType: 'greenhouse', slug: 'plivo', careersUrl: 'https://www.plivo.com/careers/', category: 'API/Communications' },
  { company: 'Hasura', atsType: 'greenhouse', slug: 'hasura', careersUrl: 'https://hasura.io/careers/', category: 'GraphQL/Dev Tools' },
  { company: 'Sourcegraph', atsType: 'greenhouse', slug: 'sourcegraph', careersUrl: 'https://sourcegraph.com/jobs', category: 'Dev Tools' },
  { company: 'Retool', atsType: 'greenhouse', slug: 'retool', careersUrl: 'https://retool.com/careers', category: 'Dev Tools' },
  { company: 'Wiz', atsType: 'greenhouse', slug: 'wiz', careersUrl: 'https://www.wiz.io/careers', category: 'Cloud Security' },
  { company: 'Klaviyo', atsType: 'greenhouse', slug: 'klaviyo', careersUrl: 'https://www.klaviyo.com/careers', category: 'Marketing/SaaS' },
  { company: 'Gusto', atsType: 'greenhouse', slug: 'gusto', careersUrl: 'https://gusto.com/careers', category: 'HR/Fintech' },
  { company: 'Checkr', atsType: 'greenhouse', slug: 'checkr', careersUrl: 'https://checkr.com/careers', category: 'SaaS' },
  { company: 'Asana', atsType: 'greenhouse', slug: 'asana', careersUrl: 'https://asana.com/jobs', category: 'Productivity' },
  { company: 'Benchling', atsType: 'greenhouse', slug: 'benchling', careersUrl: 'https://www.benchling.com/careers', category: 'BioTech/SaaS' },
  { company: 'Snyk', atsType: 'greenhouse', slug: 'snyk', careersUrl: 'https://snyk.io/careers/', category: 'DevSecOps' },
  { company: 'HashiCorp', atsType: 'greenhouse', slug: 'hashicorp', careersUrl: 'https://www.hashicorp.com/careers', category: 'Dev Tools/Infrastructure' },
  { company: 'GitHub', atsType: 'greenhouse', slug: 'github', careersUrl: 'https://github.com/about/careers', category: 'Dev Tools' },
  { company: 'DigitalOcean', atsType: 'greenhouse', slug: 'digitalocean', careersUrl: 'https://www.digitalocean.com/careers', category: 'Cloud' },
  { company: 'PagerDuty', atsType: 'greenhouse', slug: 'pagerduty', careersUrl: 'https://www.pagerduty.com/careers/', category: 'Operations' },
  { company: 'Nutanix', atsType: 'greenhouse', slug: 'nutanix', careersUrl: 'https://www.nutanix.com/careers', category: 'Cloud/Infrastructure' },
  { company: 'Palo Alto Networks', atsType: 'greenhouse', slug: 'paloaltonetworks', careersUrl: 'https://www.paloaltonetworks.com/company/careers', category: 'Security' },
  { company: 'Varonis', atsType: 'greenhouse', slug: 'varonis', careersUrl: 'https://www.varonis.com/careers', category: 'Security' },
  { company: 'SentinelOne', atsType: 'greenhouse', slug: 'sentinelone', careersUrl: 'https://www.sentinelone.com/careers/', category: 'Security' },
  { company: 'CrowdStrike', atsType: 'greenhouse', slug: 'crowdstrike', careersUrl: 'https://www.crowdstrike.com/careers/', category: 'Security' },
  { company: 'F5', atsType: 'greenhouse', slug: 'f5', careersUrl: 'https://www.f5.com/company/careers', category: 'Networking/Security' },
  { company: 'NetApp', atsType: 'greenhouse', slug: 'netapp', careersUrl: 'https://www.netapp.com/careers/', category: 'Storage/Cloud' },
  { company: 'Zeta', atsType: 'greenhouse', slug: 'zeta', careersUrl: 'https://www.zeta.tech/careers/', category: 'Fintech/India' },
  { company: 'Razorpay', atsType: 'greenhouse', slug: 'razorpay', careersUrl: 'https://razorpay.com/jobs/', category: 'Fintech/India' },
  { company: 'Chargebee', atsType: 'greenhouse', slug: 'chargebee', careersUrl: 'https://www.chargebee.com/careers/', category: 'SaaS/India' },
  { company: 'Yellow.ai', atsType: 'greenhouse', slug: 'yellowai', careersUrl: 'https://yellow.ai/careers/', category: 'AI/India' },
  { company: 'SingleStore', atsType: 'greenhouse', slug: 'singlestore', careersUrl: 'https://www.singlestore.com/careers/', category: 'Databases' },
  { company: 'Cockroach Labs', atsType: 'greenhouse', slug: 'cockroachlabs', careersUrl: 'https://www.cockroachlabs.com/careers/', category: 'Databases' },
  { company: 'Yugabyte', atsType: 'greenhouse', slug: 'yugabyte', careersUrl: 'https://www.yugabyte.com/careers/', category: 'Databases' },
  { company: 'Neo4j', atsType: 'greenhouse', slug: 'neo4j', careersUrl: 'https://neo4j.com/careers/', category: 'Databases' },
  { company: 'Scale AI', atsType: 'greenhouse', slug: 'scaleai', careersUrl: 'https://scale.com/careers', category: 'AI' },
  { company: 'Anthropic', atsType: 'greenhouse', slug: 'anthropic', careersUrl: 'https://www.anthropic.com/careers', category: 'AI' },

  // Lever
  { company: 'Urban Company', atsType: 'lever', slug: 'urbancompany', careersUrl: 'https://www.urbancompany.com/careers', category: 'Consumer Tech/India' },
  { company: 'Delhivery', atsType: 'lever', slug: 'delhivery', careersUrl: 'https://www.delhivery.com/careers', category: 'Logistics/India' },
  { company: 'Apollo.io', atsType: 'lever', slug: 'apolloio', careersUrl: 'https://www.apollo.io/careers', category: 'SaaS' },
  { company: 'Mixpanel', atsType: 'lever', slug: 'mixpanel', careersUrl: 'https://mixpanel.com/jobs/', category: 'Analytics' },
  { company: 'Clear (ClearTax)', atsType: 'lever', slug: 'clear', careersUrl: 'https://clear.in/careers', category: 'Fintech/India' },
  { company: 'Slice', atsType: 'lever', slug: 'slice', careersUrl: 'https://sliceit.com/careers', category: 'Fintech/India' },
  { company: 'Lenskart', atsType: 'lever', slug: 'lenskart', careersUrl: 'https://www.lenskart.com/careers', category: 'E-Commerce/India' },
  { company: 'Kuku FM', atsType: 'lever', slug: 'kukufm', careersUrl: 'https://kukufm.com/careers', category: 'Audio/India' },
  { company: '100ms', atsType: 'lever', slug: '100ms', careersUrl: 'https://www.100ms.live/careers', category: 'Video/Dev Tools' },
  { company: 'HyperVerge', atsType: 'lever', slug: 'hyperverge', careersUrl: 'https://hyperverge.co/careers/', category: 'AI/India' },
  { company: 'Unacademy', atsType: 'lever', slug: 'unacademy', careersUrl: 'https://unacademy.com/careers', category: 'EdTech/India' },
  { company: 'Cars24', atsType: 'lever', slug: 'cars24', careersUrl: 'https://www.cars24.com/careers/', category: 'AutoTech/India' },
  { company: 'Smallcase', atsType: 'lever', slug: 'smallcase', careersUrl: 'https://smallcase.com/careers', category: 'Fintech/India' },

  // Ashby
  { company: 'DevRev', atsType: 'ashby', slug: 'devrev', careersUrl: 'https://devrev.ai/careers', category: 'Dev Tools/AI' },
  { company: 'Vanta', atsType: 'ashby', slug: 'vanta', careersUrl: 'https://www.vanta.com/careers', category: 'Security' },
  { company: 'Deel', atsType: 'ashby', slug: 'deel', careersUrl: 'https://www.deel.com/careers', category: 'HR/Fintech' },
  { company: 'Framer', atsType: 'ashby', slug: 'framer', careersUrl: 'https://www.framer.com/careers/', category: 'Design/Dev Tools' },
  { company: 'Abridge', atsType: 'ashby', slug: 'abridge', careersUrl: 'https://www.abridge.com/careers', category: 'AI/HealthTech' },
  { company: 'PostHog', atsType: 'ashby', slug: 'posthog', careersUrl: 'https://posthog.com/careers', category: 'Dev Tools/Analytics' },
  { company: 'Fly.io', atsType: 'ashby', slug: 'flyio', careersUrl: 'https://fly.io/jobs/', category: 'Cloud/Infrastructure' },
  { company: 'Render', atsType: 'ashby', slug: 'render', careersUrl: 'https://render.com/careers', category: 'Cloud' },
  { company: 'Runway', atsType: 'ashby', slug: 'runway', careersUrl: 'https://runwayml.com/careers', category: 'AI' },
  { company: 'Voiceflow', atsType: 'ashby', slug: 'voiceflow', careersUrl: 'https://www.voiceflow.com/careers', category: 'AI/Dev Tools' },
  { company: 'Pydantic', atsType: 'ashby', slug: 'pydantic', careersUrl: 'https://pydantic.dev/careers', category: 'Dev Tools' },

  // SmartRecruiters
  { company: 'Siemens India', atsType: 'smartrecruiters', slug: 'siemens', careersUrl: 'https://jobs.siemens.com/', category: 'Industrial/Tech' },
  { company: 'Bosch India', atsType: 'smartrecruiters', slug: 'bosch', careersUrl: 'https://www.bosch.in/careers/', category: 'Automotive/Tech' },
  { company: 'Mastercard', atsType: 'smartrecruiters', slug: 'mastercard', careersUrl: 'https://careers.mastercard.com/', category: 'Payments' },
  { company: 'Publicis Sapient', atsType: 'smartrecruiters', slug: 'publicissapient', careersUrl: 'https://www.publicissapient.com/careers', category: 'Consulting/Tech' },
  { company: 'Square / Block', atsType: 'smartrecruiters', slug: 'block', careersUrl: 'https://block.xyz/careers', category: 'Fintech' },
  { company: 'Avalara', atsType: 'smartrecruiters', slug: 'avalara', careersUrl: 'https://www.avalara.com/careers', category: 'SaaS' },
  { company: 'Highspot', atsType: 'smartrecruiters', slug: 'highspot', careersUrl: 'https://www.highspot.com/careers/', category: 'SaaS' },

  // Recruitee
  { company: 'bunq', atsType: 'recruitee', slug: 'bunq', careersUrl: 'https://jobs.bunq.com', category: 'Fintech' },
  { company: 'MessageBird', atsType: 'recruitee', slug: 'messagebird', careersUrl: 'https://jobs.messagebird.com', category: 'Communications' },
  { company: 'Usercentrics', atsType: 'recruitee', slug: 'usercentrics', careersUrl: 'https://usercentrics.recruitee.com', category: 'Privacy/SaaS' }
];

function isTechnicalTitle(title: string): boolean {
  const t = title.toLowerCase();
  const techTerms = [
    'software', 'engineer', 'developer', 'frontend', 'backend', 'fullstack', 'full-stack',
    'full stack', 'platform', 'cloud', 'devops', 'sre', 'site reliability', 'data engineer',
    'data science', 'data scientist', 'machine learning', 'ai', 'ml', 'security', 'mobile',
    'android', 'ios', 'architect', 'qa', 'test engineer', 'automation', 'infrastructure'
  ];
  return techTerms.some(term => t.includes(term));
}

async function runPreflight() {
  console.log(`Starting preflight verification for ${candidates.length} candidate companies...\n`);

  const now = Date.now();
  const h168 = now - 168 * 60 * 60 * 1000;
  const h24 = now - 24 * 60 * 60 * 1000;

  const results: any[] = [];

  for (const c of candidates) {
    let rawJobs: RawATSJob[] = [];
    let status: 'VERIFIED_HEALTHY' | 'VERIFIED_EMPTY' | 'INVALID_IDENTIFIER' | 'FAILED' = 'FAILED';
    let errorMsg: string | undefined;

    try {
      if (c.atsType === 'greenhouse') {
        rawJobs = await fetchGreenhouseJobs(c.slug);
      } else if (c.atsType === 'lever') {
        rawJobs = await fetchLeverJobs(c.slug);
      } else if (c.atsType === 'ashby') {
        rawJobs = await fetchAshbyJobs(c.slug);
      } else if (c.atsType === 'smartrecruiters') {
        rawJobs = await fetchSmartRecruitersJobs(c.slug);
      } else if (c.atsType === 'recruitee') {
        rawJobs = await fetchRecruiteeJobs(c.slug);
      }

      if (rawJobs.length > 0) {
        status = 'VERIFIED_HEALTHY';
      } else {
        status = 'VERIFIED_EMPTY';
      }
    } catch (err: any) {
      if (err.message?.includes('404') || err.message?.includes('invalid') || err.message?.includes('HTTP 404')) {
        status = 'INVALID_IDENTIFIER';
      } else {
        status = 'FAILED';
      }
      errorMsg = err.message;
    }

    const indiaJobs = rawJobs;
    const countIndiaTotal = indiaJobs.length;

    let count168h = 0;
    let count24h = 0;
    let countTech168h = 0;

    for (const job of indiaJobs) {
      const postDate = job.postedAt ? new Date(job.postedAt).getTime() : 0;
      const is168 = postDate >= h168;
      const is24 = postDate >= h24;
      const isTech = isTechnicalTitle(job.title);

      if (is168) count168h++;
      if (is24) count24h++;
      if (is168 && isTech) countTech168h++;
    }

    results.push({
      company: c.company,
      atsType: c.atsType,
      slug: c.slug,
      careersUrl: c.careersUrl,
      category: c.category,
      status,
      errorMsg,
      rawJobsCount: rawJobs.length,
      indiaJobsCount: countIndiaTotal,
      india168h: count168h,
      india24h: count24h,
      indiaTech168h: countTech168h,
    });

    console.log(`[Preflight] ${c.company} (${c.atsType}:${c.slug}) -> ${status} | India Total: ${countIndiaTotal} | India Fresh 168h: ${count168h} | India Tech 168h: ${countTech168h}`);
  }

  console.log('\n==================================================');
  console.log('PREFLIGHT VERIFICATION SUMMARY REPORT');
  console.log('==================================================');
  
  const healthy = results.filter(r => r.status === 'VERIFIED_HEALTHY');
  const empty = results.filter(r => r.status === 'VERIFIED_EMPTY');
  const invalid = results.filter(r => r.status === 'INVALID_IDENTIFIER');
  const failed = results.filter(r => r.status === 'FAILED');
  const withIndia = healthy.filter(r => r.indiaJobsCount > 0);
  const withTech168h = healthy.filter(r => r.indiaTech168h > 0);

  console.log(`1. Proposed companies: ${candidates.length}`);
  console.log(`2. VERIFIED_HEALTHY: ${healthy.length}`);
  console.log(`3. VERIFIED_EMPTY: ${empty.length}`);
  console.log(`4. INVALID_IDENTIFIER: ${invalid.length}`);
  console.log(`5. FAILED: ${failed.length}`);
  console.log(`6. Healthy companies with current India jobs: ${withIndia.length}`);
  console.log(`7. Healthy companies with India technical jobs <=168h: ${withTech168h.length}`);

  console.log('\n--- ALL VERIFIED HEALTHY COMPANIES SORTED BY INDIA TECH 168H YIELD ---');
  healthy.sort((a, b) => b.indiaTech168h - a.indiaTech168h || b.indiaJobsCount - a.indiaJobsCount);
  console.table(healthy.map(r => ({
    Company: r.company,
    ATS: r.atsType,
    Slug: r.slug,
    'India Total': r.indiaJobsCount,
    'India 168h': r.india168h,
    'India 24h': r.india24h,
    'India Tech 168h': r.indiaTech168h,
  })));
}

runPreflight();
