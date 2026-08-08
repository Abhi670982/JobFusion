export {};
interface WorkdayCompany {
  company: string;
  host: string;
  tenant: string;
  siteId: string;
}

const workdayTargets: WorkdayCompany[] = [
  { company: 'Adobe', host: 'adobe.wd5.myworkdayjobs.com', tenant: 'adobe', siteId: 'external_experienced' },
  { company: 'Salesforce', host: 'salesforce.wd1.myworkdayjobs.com', tenant: 'salesforce', siteId: 'External_Career_Site' },
  { company: 'NVIDIA', host: 'nvidia.wd5.myworkdayjobs.com', tenant: 'nvidia', siteId: 'NVIDIAExternalCareerSite' },
  { company: 'Cisco', host: 'cisco.wd1.myworkdayjobs.com', tenant: 'cisco', siteId: 'Cisco_Careers' },
  { company: 'Walmart Global Tech', host: 'walmart.wd5.myworkdayjobs.com', tenant: 'walmart', siteId: 'WalmartExternal' },
  { company: 'Intuit', host: 'intuit.wd5.myworkdayjobs.com', tenant: 'intuit', siteId: 'Intuit_External_Careers' },
  { company: 'Qualcomm', host: 'qualcomm.wd5.myworkdayjobs.com', tenant: 'qualcomm', siteId: 'External' },
  { company: 'Autodesk', host: 'autodesk.wd1.myworkdayjobs.com', tenant: 'autodesk', siteId: 'Ext' },
  { company: 'Workday Inc', host: 'workday.wd5.myworkdayjobs.com', tenant: 'workday', siteId: 'Workday' },
  { company: 'Atlassian (Workday)', host: 'atlassian.wd1.myworkdayjobs.com', tenant: 'atlassian', siteId: 'External' },
  { company: 'Palo Alto Networks', host: 'paloaltonetworks.wd1.myworkdayjobs.com', tenant: 'paloaltonetworks', siteId: 'External' },
  { company: 'CrowdStrike', host: 'crowdstrike.wd5.myworkdayjobs.com', tenant: 'crowdstrike', siteId: 'CrowdStrike' },
  { company: 'Nutanix', host: 'nutanix.wd1.myworkdayjobs.com', tenant: 'nutanix', siteId: 'Nutanix' },
];

async function testWorkday(c: WorkdayCompany) {
  const url = `https://${c.host}/wday/cxs/${c.tenant}/${c.siteId}/jobs`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Gohyred-CrawlEngine/1.0',
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
      console.log(`❌ FAIL: ${c.company} -> HTTP ${res.status}`);
      return;
    }

    const data = await res.json();
    const total = data.total || 0;
    const postings = Array.isArray(data.jobPostings) ? data.jobPostings : [];
    console.log(`✅ WORKDAY VERIFIED: ${c.company} -> Total Requisitions: ${total}, Sample Postings Returned: ${postings.length}`);
    if (postings.length > 0) {
      console.log(`   Sample Requisition: "${postings[0].title}" | Location: "${postings[0].locationsText}"`);
    }
  } catch (err: any) {
    console.log(`❌ ERROR: ${c.company} -> ${err.message}`);
  }
}

async function main() {
  console.log('Testing Reusable Workday Endpoint Architecture across Target GCCs...\n');
  for (const target of workdayTargets) {
    await testWorkday(target);
  }
}

main();
