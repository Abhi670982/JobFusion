export {};
import { parseIndiaLocation } from '../lib/adapters/ats-apis';

interface WorkdayTarget {
  company: string;
  careersUrl: string;
  host: string;
  tenant: string;
  siteId: string;
}

const workdayTargets: WorkdayTarget[] = [
  { company: 'Adobe', careersUrl: 'https://adobe.wd5.myworkdayjobs.com/external_experienced', host: 'adobe.wd5.myworkdayjobs.com', tenant: 'adobe', siteId: 'external_experienced' },
  { company: 'NVIDIA', careersUrl: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite', host: 'nvidia.wd5.myworkdayjobs.com', tenant: 'nvidia', siteId: 'NVIDIAExternalCareerSite' },
  { company: 'Autodesk', careersUrl: 'https://autodesk.wd1.myworkdayjobs.com/Ext', host: 'autodesk.wd1.myworkdayjobs.com', tenant: 'autodesk', siteId: 'Ext' },
  { company: 'Workday Inc', careersUrl: 'https://workday.wd5.myworkdayjobs.com/Workday', host: 'workday.wd5.myworkdayjobs.com', tenant: 'workday', siteId: 'Workday' },
  { company: 'Salesforce', careersUrl: 'https://salesforce.wd1.myworkdayjobs.com/External_Career_Site', host: 'salesforce.wd1.myworkdayjobs.com', tenant: 'salesforce', siteId: 'External_Career_Site' },
  { company: 'Cisco', careersUrl: 'https://cisco.wd1.myworkdayjobs.com/Cisco_Careers', host: 'cisco.wd1.myworkdayjobs.com', tenant: 'cisco', siteId: 'Cisco_Careers' },
  { company: 'Walmart Global Tech', careersUrl: 'https://walmart.wd5.myworkdayjobs.com/WalmartExternal', host: 'walmart.wd5.myworkdayjobs.com', tenant: 'walmart', siteId: 'WalmartExternal' },
  { company: 'Intuit', careersUrl: 'https://intuit.wd5.myworkdayjobs.com/Intuit_External_Careers', host: 'intuit.wd5.myworkdayjobs.com', tenant: 'intuit', siteId: 'Intuit_External_Careers' },
  { company: 'Qualcomm', careersUrl: 'https://qualcomm.wd5.myworkdayjobs.com/External', host: 'qualcomm.wd5.myworkdayjobs.com', tenant: 'qualcomm', siteId: 'External' },
  { company: 'Atlassian', careersUrl: 'https://atlassian.wd1.myworkdayjobs.com/External', host: 'atlassian.wd1.myworkdayjobs.com', tenant: 'atlassian', siteId: 'External' },
  { company: 'Palo Alto Networks', careersUrl: 'https://paloaltonetworks.wd1.myworkdayjobs.com/External', host: 'paloaltonetworks.wd1.myworkdayjobs.com', tenant: 'paloaltonetworks', siteId: 'External' },
  { company: 'CrowdStrike', careersUrl: 'https://crowdstrike.wd5.myworkdayjobs.com/CrowdStrike', host: 'crowdstrike.wd5.myworkdayjobs.com', tenant: 'crowdstrike', siteId: 'CrowdStrike' },
  { company: 'Nutanix', careersUrl: 'https://nutanix.wd1.myworkdayjobs.com/Nutanix', host: 'nutanix.wd1.myworkdayjobs.com', tenant: 'nutanix', siteId: 'Nutanix' },
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

function parseRelativePostedOn(postedOnText: string): Date {
  const now = new Date();
  const lower = (postedOnText || '').toLowerCase().trim();
  if (lower.includes('today') || lower.includes('24h') || lower.includes('1 day')) {
    return now;
  }
  const match = lower.match(/(\d+)\s+days?\s+ago/);
  if (match) {
    const days = parseInt(match[1], 10);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
  if (lower.includes('30+ days ago')) {
    return new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
  }
  return now;
}

async function analyzeTarget(t: WorkdayTarget) {
  const endpoint = `https://${t.host}/wday/cxs/${t.tenant}/${t.siteId}/jobs`;
  const result = {
    company: t.company,
    careersUrl: t.careersUrl,
    host: t.host,
    tenant: t.tenant,
    siteId: t.siteId,
    status: 'UNKNOWN',
    globalRaw: 0,
    indiaRaw: 0,
    india168h: 0,
    india24h: 0,
    indiaTech168h: 0,
    postingDateField: '',
    locationField: '',
    paginationType: 'limit_offset',
    applyUrlPattern: '',
    notes: '',
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify({
        searchText: '',
        appliedFacets: {},
        limit: 20,
        offset: 0,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      result.status = `HTTP_${res.status}`;
      result.notes = `Endpoint returned HTTP ${res.status}`;
      return result;
    }

    const data = await res.json();
    result.status = 'HEALTHY';
    result.globalRaw = data.total || 0;
    const postings: any[] = Array.isArray(data.jobPostings) ? data.jobPostings : [];

    if (postings.length > 0) {
      const sample = postings[0];
      result.postingDateField = sample.postedOn ? 'postedOn' : 'unknown';
      result.locationField = sample.locationsText ? 'locationsText' : (sample.bulletFields ? 'bulletFields' : 'unknown');
      result.applyUrlPattern = `https://${t.host}/en-US/${t.tenant}/${t.siteId}${sample.externalPath}`;
    }

    // Now query for India specifically via search text or location filtering in Workday
    const indiaRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify({
        searchText: 'India',
        appliedFacets: {},
        limit: 50,
        offset: 0,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (indiaRes.ok) {
      const indiaData = await indiaRes.json();
      const indiaPostings: any[] = Array.isArray(indiaData.jobPostings) ? indiaData.jobPostings : [];
      const now = new Date();
      const h168 = new Date(now.getTime() - 168 * 60 * 60 * 1000);
      const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const genuinelyIndia = indiaPostings.filter(p => {
        const loc = p.locationsText || '';
        const parsed = parseIndiaLocation(loc);
        return parsed.countryCode === 'IN' || loc.toLowerCase().includes('india') || loc.toLowerCase().includes('bengaluru') || loc.toLowerCase().includes('hyderabad');
      });

      result.indiaRaw = genuinelyIndia.length;
      for (const p of genuinelyIndia) {
        const dt = parseRelativePostedOn(p.postedOn);
        if (dt >= h168) result.india168h++;
        if (dt >= h24) result.india24h++;
        if (dt >= h168 && isTechnical(p.title)) result.indiaTech168h++;
      }
    }
  } catch (err: any) {
    result.status = 'ERROR';
    result.notes = err.message;
  }

  return result;
}

async function main() {
  console.log('============================================================');
  console.log('=== WORKDAY REUSABLE ADAPTER PREFLIGHT & AUDIT ===');
  console.log('============================================================\n');

  const report: any[] = [];
  for (const target of workdayTargets) {
    const r = await analyzeTarget(target);
    report.push(r);
    console.log(`[${r.status}] ${r.company} -> Global: ${r.globalRaw}, India Search: ${r.indiaRaw}, <=168h: ${r.india168h}, Tech <=168h: ${r.indiaTech168h}`);
  }

  console.log('\n==================================================');
  console.log('WORKDAY PREFLIGHT DETAILED REPORT');
  console.log('==================================================');
  console.table(report);
}

main();
