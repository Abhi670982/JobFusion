export {};
import {
  fetchGreenhouseJobs,
  fetchLeverJobs,
  fetchAshbyJobs,
  fetchSmartRecruitersJobs,
  fetchRecruiteeJobs,
  parseIndiaLocation,
  RawATSJob
} from '../lib/adapters/ats-apis';

const candidateCompanies: { company: string; category: string; primaryAts: string; testSlugs: { ats: string; slug: string }[] }[] = [
  // 1. Greenhouse candidates
  { company: 'Zeta', category: 'Fintech/SaaS', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'zetaglobal' }] },
  { company: 'BrowserStack', category: 'DevTools/Testing', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'browserstack' }, { ats: 'greenhouse', slug: 'browserstacksoftware' }] },
  { company: 'Plivo', category: 'CPaaS/Telecom', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'plivo' }, { ats: 'greenhouse', slug: 'plivoinc' }] },
  { company: 'Hasura', category: 'GraphQL/DevTools', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'hasura' }, { ats: 'greenhouse', slug: 'hasuraio' }] },
  { company: 'Sourcegraph', category: 'DevTools/AI', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'sourcegraph' }] },
  { company: 'Retool', category: 'DevTools/LowCode', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'retool' }] },
  { company: 'Wiz', category: 'Cloud Security', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'wiz' }, { ats: 'greenhouse', slug: 'wizio' }, { ats: 'greenhouse', slug: 'wizsec' }] },
  { company: 'Benchling', category: 'BioTech SaaS', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'benchling' }] },
  { company: 'Snyk', category: 'Security/DevTools', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'snyk' }, { ats: 'greenhouse', slug: 'snykio' }] },
  { company: 'HashiCorp', category: 'Cloud Infrastructure', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'hashicorp' }] },
  { company: 'GitHub', category: 'DevTools/Code', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'github' }] },
  { company: 'DigitalOcean', category: 'Cloud Hosting', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'digitalocean' }] },
  { company: 'ThoughtSpot', category: 'Analytics/AI', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'thoughtspot' }] },
  { company: 'Cohesity', category: 'Data Management', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'cohesity' }] },
  { company: 'Varonis', category: 'Data Security', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'varonis' }] },
  { company: 'SentinelOne', category: 'Cybersecurity', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'sentinelone' }] },
  { company: 'Razorpay', category: 'Fintech/Payments', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'razorpay' }, { ats: 'greenhouse', slug: 'razorpayinc' }] },
  { company: 'Chargebee', category: 'Subscription Billing', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'chargebee' }, { ats: 'greenhouse', slug: 'chargebeeinc' }] },
  { company: 'Yellow.ai', category: 'Conversational AI', primaryAts: 'greenhouse', testSlugs: [{ ats: 'greenhouse', slug: 'yellowai' }, { ats: 'greenhouse', slug: 'yellowdotai' }] },

  // 2. Lever candidates
  { company: 'Urban Company', category: 'Services Marketplace', primaryAts: 'lever', testSlugs: [{ ats: 'lever', slug: 'urbancompany' }, { ats: 'lever', slug: 'urbanclap' }] },
  { company: 'Delhivery', category: 'Logistics/Tech', primaryAts: 'lever', testSlugs: [{ ats: 'lever', slug: 'delhivery' }] },
  { company: 'Apollo.io', category: 'Sales Intelligence', primaryAts: 'lever', testSlugs: [{ ats: 'lever', slug: 'apolloio' }, { ats: 'lever', slug: 'apollo-io' }] },
  { company: 'Mixpanel', category: 'Product Analytics', primaryAts: 'lever', testSlugs: [{ ats: 'lever', slug: 'mixpanel' }] },
  { company: 'Clear (ClearTax)', category: 'Fintech/Taxation', primaryAts: 'lever', testSlugs: [{ ats: 'lever', slug: 'clear' }, { ats: 'lever', slug: 'cleartax' }] },
  { company: 'Slice', category: 'Fintech/Cards', primaryAts: 'lever', testSlugs: [{ ats: 'lever', slug: 'slice' }, { ats: 'lever', slug: 'slicepay' }, { ats: 'lever', slug: 'sliceit' }] },
  { company: 'Lenskart', category: 'E-commerce/Retail', primaryAts: 'lever', testSlugs: [{ ats: 'lever', slug: 'lenskart' }] },
  { company: 'Kuku FM', category: 'Audio/EdTech', primaryAts: 'lever', testSlugs: [{ ats: 'lever', slug: 'kukufm' }, { ats: 'lever', slug: 'kuku-fm' }] },
  { company: 'HyperVerge', category: 'AI/Identity', primaryAts: 'lever', testSlugs: [{ ats: 'lever', slug: 'hyperverge' }] },
  { company: 'Unacademy', category: 'EdTech', primaryAts: 'lever', testSlugs: [{ ats: 'lever', slug: 'unacademy' }] },
  { company: 'Cars24', category: 'Auto Tech', primaryAts: 'lever', testSlugs: [{ ats: 'lever', slug: 'cars24' }] },
  { company: 'Smallcase', category: 'Wealth/Fintech', primaryAts: 'lever', testSlugs: [{ ats: 'lever', slug: 'smallcase' }] },

  // 3. Ashby candidates
  { company: 'DevRev', category: 'CRM/DevTools', primaryAts: 'ashby', testSlugs: [{ ats: 'ashby', slug: 'devrev' }, { ats: 'ashby', slug: 'devrev-ai' }] },
  { company: 'Framer', category: 'Design/Web', primaryAts: 'ashby', testSlugs: [{ ats: 'ashby', slug: 'framer' }] },
  { company: 'Fly.io', category: 'Cloud Infrastructure', primaryAts: 'ashby', testSlugs: [{ ats: 'ashby', slug: 'flyio' }, { ats: 'ashby', slug: 'fly' }] },
  { company: 'Voiceflow', category: 'AI/Voice', primaryAts: 'ashby', testSlugs: [{ ats: 'ashby', slug: 'voiceflow' }] },
  { company: 'Pydantic', category: 'Python/DevTools', primaryAts: 'ashby', testSlugs: [{ ats: 'ashby', slug: 'pydantic' }] },

  // 4. Recruitee candidates
  { company: 'MessageBird', category: 'CPaaS', primaryAts: 'recruitee', testSlugs: [{ ats: 'recruitee', slug: 'messagebird' }, { ats: 'recruitee', slug: 'bird' }] },
  { company: 'Usercentrics', category: 'Privacy/Consent', primaryAts: 'recruitee', testSlugs: [{ ats: 'recruitee', slug: 'usercentrics' }] },

  // 5. Workday / Custom candidates (Atlassian, DoorDash, Rippling, Zendesk, Splunk, Nutanix, Palo Alto Networks, CrowdStrike, F5, NetApp)
  { company: 'Atlassian', category: 'Enterprise DevTools', primaryAts: 'workday', testSlugs: [] },
  { company: 'DoorDash', category: 'FoodTech/Logistics', primaryAts: 'eightfold', testSlugs: [] },
  { company: 'Rippling', category: 'HR Tech/SaaS', primaryAts: 'custom', testSlugs: [] },
  { company: 'Zendesk', category: 'Support SaaS', primaryAts: 'workday', testSlugs: [] },
  { company: 'Splunk', category: 'Observability', primaryAts: 'workday', testSlugs: [] },
  { company: 'Nutanix', category: 'HCI/Cloud', primaryAts: 'workday', testSlugs: [] },
  { company: 'Palo Alto Networks', category: 'Cybersecurity', primaryAts: 'workday', testSlugs: [] },
  { company: 'CrowdStrike', category: 'Endpoint Security', primaryAts: 'workday', testSlugs: [] },
  { company: 'F5', category: 'Networking/Security', primaryAts: 'workday', testSlugs: [] },
  { company: 'NetApp', category: 'Storage/Data', primaryAts: 'workday', testSlugs: [] },
];

function isTechnical(title: string): boolean {
  const t = title.toLowerCase();
  const techKeywords = [
    'engineer', 'developer', 'architect', 'data scientist', 'data analyst',
    'software', 'backend', 'frontend', 'fullstack', 'full-stack', 'devops',
    'sre', 'site reliability', 'qa', 'test', 'security', 'infrastructure',
    'platform', 'cloud', 'machine learning', 'ai', 'systems', 'network',
    'database', 'solutions architect', 'tech lead', 'engineering manager'
  ];
  return techKeywords.some(k => t.includes(k));
}

async function preflightOneCompany(c: typeof candidateCompanies[0]) {
  if (c.testSlugs.length === 0) {
    return {
      company: c.company,
      category: c.category,
      status: 'REQUIRES_WORKDAY_OR_CUSTOM',
      ats: c.primaryAts,
      workingSlug: null,
      rawJobs: 0,
      indiaJobs: 0,
      fresh168h: 0,
      fresh24h: 0,
      tech168h: 0
    };
  }

  const now = new Date();
  const h168 = new Date(now.getTime() - 168 * 60 * 60 * 1000);
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  for (const ts of c.testSlugs) {
    try {
      let rawList: RawATSJob[] = [];
      if (ts.ats === 'greenhouse') rawList = await fetchGreenhouseJobs(ts.slug);
      else if (ts.ats === 'lever') rawList = await fetchLeverJobs(ts.slug);
      else if (ts.ats === 'ashby') rawList = await fetchAshbyJobs(ts.slug);
      else if (ts.ats === 'smartrecruiters') rawList = await fetchSmartRecruitersJobs(ts.slug);
      else if (ts.ats === 'recruitee') rawList = await fetchRecruiteeJobs(ts.slug);

      const rawJobs = rawList.length;
      if (rawJobs === 0) {
        continue;
      }

      // Filter for India eligibility under existing parseIndiaLocation rules
      const indiaList = rawList.filter(job => {
        const parsed = parseIndiaLocation(job.location, (job as any).atsCountryObj);
        return parsed.countryCode === 'IN';
      });

      const indiaJobs = indiaList.length;

      let fresh168h = 0;
      let fresh24h = 0;
      let tech168h = 0;

      for (const job of indiaList) {
        const pDate = job.postedAt ? new Date(job.postedAt) : now;
        const is168 = pDate >= h168;
        const is24 = pDate >= h24;

        if (is168) fresh168h++;
        if (is24) fresh24h++;
        if (is168 && isTechnical(job.title)) tech168h++;
      }

      return {
        company: c.company,
        category: c.category,
        status: indiaJobs > 0 ? 'VERIFIED_HEALTHY' : 'VERIFIED_EMPTY',
        ats: ts.ats,
        workingSlug: ts.slug,
        rawJobs,
        indiaJobs,
        fresh168h,
        fresh24h,
        tech168h
      };
    } catch (err) {
      // ignore & try next slug
    }
  }

  return {
    company: c.company,
    category: c.category,
    status: 'INVALID_IDENTIFIER',
    ats: c.primaryAts,
    workingSlug: null,
    rawJobs: 0,
    indiaJobs: 0,
    fresh168h: 0,
    fresh24h: 0,
    tech168h: 0
  };
}

async function main() {
  console.log('============================================================');
  console.log('=== PHASE D3 WAVE 1B ATS RECOVERY PREFLIGHT AUDIT ===');
  console.log('============================================================\n');

  const results: any[] = [];
  for (const c of candidateCompanies) {
    const res = await preflightOneCompany(c);
    results.push(res);
    if (res.status === 'VERIFIED_HEALTHY') {
      console.log(`✅ [VERIFIED_HEALTHY] ${res.company} (${res.ats}:${res.workingSlug}) -> Raw: ${res.rawJobs}, India: ${res.indiaJobs}, <=168h: ${res.fresh168h}, <=24h: ${res.fresh24h}, Tech <=168h: ${res.tech168h}`);
    } else if (res.status === 'VERIFIED_EMPTY') {
      console.log(`⚠️ [VERIFIED_EMPTY] ${res.company} (${res.ats}:${res.workingSlug}) -> Raw: ${res.rawJobs}, India: 0`);
    } else if (res.status === 'REQUIRES_WORKDAY_OR_CUSTOM') {
      console.log(`ℹ️ [WORKDAY/CUSTOM] ${res.company} -> Uses ${res.ats}`);
    } else {
      console.log(`❌ [INVALID_IDENTIFIER] ${res.company} -> Tested ${c.testSlugs.map(s => s.slug).join(', ')}`);
    }
  }

  console.log('\n==================================================');
  console.log('PREFLIGHT SUMMARY');
  console.log('==================================================');
  console.table(results);
}

main();
