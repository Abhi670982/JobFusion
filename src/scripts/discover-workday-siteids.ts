export {};
const targets = [
  { company: 'Salesforce', host: 'salesforce.wd1.myworkdayjobs.com', tenant: 'salesforce', siteIds: ['External_Career_Site', 'External_Careers', 'Salesforce_Careers', 'Careers', 'External'] },
  { company: 'Cisco', host: 'cisco.wd1.myworkdayjobs.com', tenant: 'cisco', siteIds: ['Cisco_Careers', 'External', 'Careers', 'Cisco_External'] },
  { company: 'Intuit', host: 'intuit.wd5.myworkdayjobs.com', tenant: 'intuit', siteIds: ['Intuit_External_Careers', 'External', 'Careers', 'Intuit_Careers'] },
  { company: 'Qualcomm', host: 'qualcomm.wd5.myworkdayjobs.com', tenant: 'qualcomm', siteIds: ['External', 'Qualcomm_Careers', 'External_Careers', 'Careers'] },
  { company: 'Walmart', host: 'walmart.wd5.myworkdayjobs.com', tenant: 'walmart', siteIds: ['WalmartExternal', 'Walmart_Careers', 'External', 'Careers'] },
  { company: 'Palo Alto Networks', host: 'paloaltonetworks.wd1.myworkdayjobs.com', tenant: 'paloaltonetworks', siteIds: ['External', 'PANW_Careers', 'Careers', 'PaloAltoNetworks'] },
  { company: 'CrowdStrike', host: 'crowdstrike.wd5.myworkdayjobs.com', tenant: 'crowdstrike', siteIds: ['CrowdStrike', 'External', 'Careers', 'CrowdStrike_Careers'] },
  { company: 'Nutanix', host: 'nutanix.wd1.myworkdayjobs.com', tenant: 'nutanix', siteIds: ['Nutanix', 'External', 'Careers', 'Nutanix_Careers'] },
];

async function check(company: string, host: string, tenant: string, siteId: string) {
  const url = `https://${host}/wday/cxs/${tenant}/${siteId}/jobs`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ searchText: '', limit: 10, offset: 0 }),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`🎉 MATCH FOUND! ${company} -> Host: ${host}, Tenant: ${tenant}, SiteId: "${siteId}", Total Jobs: ${data.total}`);
      return true;
    }
  } catch (err) {}
  return false;
}

async function main() {
  console.log('Discovering Workday siteId variations...\n');
  for (const t of targets) {
    for (const siteId of t.siteIds) {
      if (await check(t.company, t.host, t.tenant, siteId)) break;
    }
  }
}

main();
