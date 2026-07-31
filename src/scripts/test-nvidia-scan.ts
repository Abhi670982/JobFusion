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

async function main() {
  const url = 'https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/jobs';
  console.log('Scanning NVIDIA Workday requisitions (2000 total)...');

  let offset = 0;
  const limit = 20;
  const now = new Date();
  const h168 = new Date(now.getTime() - 168 * 60 * 60 * 1000);
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let indiaRaw = 0;
  let india168h = 0;
  let india24h = 0;
  let indiaTech168h = 0;

  while (offset < 2000) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ searchText: '', appliedFacets: {}, limit, offset }),
    });

    if (!res.ok) break;
    const data = await res.json();
    const postings: any[] = data.jobPostings || [];
    if (postings.length === 0) break;

    for (const p of postings) {
      const loc = p.locationsText || '';
      const parsed = parseIndiaLocation(loc);
      if (parsed.countryCode === 'IN' || loc.toLowerCase().includes('india') || loc.toLowerCase().includes('bengaluru') || loc.toLowerCase().includes('hyderabad') || loc.toLowerCase().includes('pune')) {
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
    if (offset % 200 === 0) {
      console.log(`Scanned ${offset}/2000 requisitions -> Found ${indiaRaw} India jobs so far...`);
    }
  }

  console.log('✅ NVIDIA SCAN COMPLETE:');
  console.log(`   Global Jobs: 2000`);
  console.log(`   India Jobs: ${indiaRaw}`);
  console.log(`   India <=168h: ${india168h}`);
  console.log(`   India <=24h: ${india24h}`);
  console.log(`   India Technical <=168h: ${indiaTech168h}`);
}

main();
