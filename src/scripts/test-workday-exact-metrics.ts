export {};
import { parseIndiaLocation } from '../lib/adapters/ats-apis';

interface Target {
  company: string;
  host: string;
  tenant: string;
  siteId: string;
}

const targets: Target[] = [
  { company: 'Adobe', host: 'adobe.wd5.myworkdayjobs.com', tenant: 'adobe', siteId: 'external_experienced' },
  { company: 'NVIDIA', host: 'nvidia.wd5.myworkdayjobs.com', tenant: 'nvidia', siteId: 'NVIDIAExternalCareerSite' },
  { company: 'Autodesk', host: 'autodesk.wd1.myworkdayjobs.com', tenant: 'autodesk', siteId: 'Ext' },
  { company: 'Workday Inc', host: 'workday.wd5.myworkdayjobs.com', tenant: 'workday', siteId: 'Workday' },
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
  if (lower.includes('today') || lower.includes('24h') || lower.includes('1 day') || lower.includes('posted today')) {
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

async function auditIndiaJobs(t: Target) {
  const url = `https://${t.host}/wday/cxs/${t.tenant}/${t.siteId}/jobs`;
  const now = new Date();
  const h168 = new Date(now.getTime() - 168 * 60 * 60 * 1000);
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let globalTotal = 0;
  let indiaTotal = 0;
  let india168h = 0;
  let india24h = 0;
  let indiaTech168h = 0;

  // Step 1: Initial call to fetch global total & locationMainGroup facet
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ searchText: '', appliedFacets: {}, limit: 20, offset: 0 }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    globalTotal = data.total || 0;

    const facets = data.facets || [];
    const locFacet = facets.find((f: any) => f.facetParameter === 'locationMainGroup' || f.facetParameter === 'locationCountry' || f.facetParameter === 'locationHierarchy1');

    let indiaFacetId = null;
    if (locFacet && locFacet.values) {
      const indiaVal = locFacet.values.find((v: any) => (v.descriptor || '').toLowerCase().includes('india'));
      if (indiaVal) {
        indiaFacetId = indiaVal.id;
      }
    }

    // Step 2: Fetch all jobs for India (by facet if available, or paginate all)
    let offset = 0;
    const limit = 50;
    const keepGoing = true;

    while (keepGoing && offset < 500) {
      const payload: any = { searchText: '', limit, offset };
      if (indiaFacetId && locFacet) {
        payload.appliedFacets = { [locFacet.facetParameter]: [indiaFacetId] };
      }

      const pageRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!pageRes.ok) break;
      const pageData = await pageRes.json();
      const postings: any[] = pageData.jobPostings || [];
      if (postings.length === 0) break;

      if (indiaFacetId) {
        indiaTotal = pageData.total || postings.length;
      }

      for (const p of postings) {
        const loc = p.locationsText || '';
        const parsed = parseIndiaLocation(loc);
        if (indiaFacetId || parsed.countryCode === 'IN') {
          if (!indiaFacetId) indiaTotal++;
          const pDate = parseRelativePostedOn(p.postedOn);
          const is168 = pDate >= h168;
          const is24 = pDate >= h24;
          if (is168) india168h++;
          if (is24) india24h++;
          if (is168 && isTechnical(p.title)) indiaTech168h++;
        }
      }

      offset += limit;
      if (offset >= (pageData.total || 0)) break;
    }

    return {
      company: t.company,
      host: t.host,
      tenant: t.tenant,
      siteId: t.siteId,
      globalTotal,
      indiaTotal,
      india168h,
      india24h,
      indiaTech168h,
      hasIndiaFacet: !!indiaFacetId
    };
  } catch (err: any) {
    return null;
  }
}

async function main() {
  console.log('Fetching exact Workday India Metrics via API Facet / Pagination...\n');
  const results = [];
  for (const target of targets) {
    const res = await auditIndiaJobs(target);
    if (res) results.push(res);
  }
  console.table(results);
}

main();
