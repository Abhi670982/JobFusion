export {};
import { parseIndiaLocation } from '../lib/adapters/ats-apis';

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

async function fullScan(company: string, host: string, tenant: string, siteId: string) {
  const url = `https://${host}/wday/cxs/${tenant}/${siteId}/jobs`;
  console.log(`Starting full Workday pagination scan for ${company}...`);

  let offset = 0;
  const limit = 20;
  const now = new Date();
  const h168 = new Date(now.getTime() - 168 * 60 * 60 * 1000);
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let globalTotal = 0;
  let indiaRaw = 0;
  let india168h = 0;
  let india24h = 0;
  let indiaTech168h = 0;

  while (true) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ searchText: '', appliedFacets: {}, limit, offset }),
    });

    if (!res.ok) break;
    const data = await res.json();
    globalTotal = data.total || 0;
    const postings: any[] = data.jobPostings || [];
    if (postings.length === 0) break;

    for (const p of postings) {
      const loc = p.locationsText || '';
      const parsed = parseIndiaLocation(loc);
      if (parsed.countryCode === 'IN') {
        indiaRaw++;
        const pDate = parseRelativePostedOn(p.postedOn);
        const is168 = pDate >= h168;
        const is24 = pDate >= h24;
        if (is168) india168h++;
        if (is24) india24h++;
        if (is168 && isTechnical(p.title)) indiaTech168h++;
      }
    }

    offset += limit;
    if (offset >= globalTotal) break;
  }

  console.log(`✅ SCAN COMPLETE for ${company}:`);
  console.log(`   Global Jobs: ${globalTotal}`);
  console.log(`   India Jobs Found: ${indiaRaw}`);
  console.log(`   India <=168h: ${india168h}`);
  console.log(`   India <=24h: ${india24h}`);
  console.log(`   India Technical <=168h: ${indiaTech168h}`);

  return {
    company,
    host,
    tenant,
    siteId,
    globalTotal,
    indiaRaw,
    india168h,
    india24h,
    indiaTech168h
  };
}

async function main() {
  const r1 = await fullScan('Adobe', 'adobe.wd5.myworkdayjobs.com', 'adobe', 'external_experienced');
  const r2 = await fullScan('Autodesk', 'autodesk.wd1.myworkdayjobs.com', 'autodesk', 'Ext');
  const r3 = await fullScan('Workday Inc', 'workday.wd5.myworkdayjobs.com', 'workday', 'Workday');

  console.log('\n==================================================');
  console.log('WORKDAY FULL SCAN SUMMARY');
  console.log('==================================================');
  console.table([r1, r2, r3]);
}

main();
