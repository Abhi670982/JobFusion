import { fetchGreenhouseJobs, fetchLeverJobs, fetchAshbyJobs, fetchSmartRecruitersJobs, fetchRecruiteeJobs, RawATSJob } from '../lib/adapters/ats-apis';

const candidateSlugs: { company: string; ats: string; slugs: string[] }[] = [
  // Greenhouse candidates
  { company: 'Atlassian', ats: 'greenhouse', slugs: ['atlassian', 'atlassianinc', 'atlassiancareers', 'atlassiansoftware'] },
  { company: 'DoorDash', ats: 'greenhouse', slugs: ['doordash', 'doordashinc', 'doordashcareers', 'doordashjobs'] },
  { company: 'Rippling', ats: 'greenhouse', slugs: ['rippling', 'ripplinginc', 'ripplingcareers', 'ripplinghr'] },
  { company: 'Zendesk', ats: 'greenhouse', slugs: ['zendesk', 'zendeskinc', 'zendeskcareers'] },
  { company: 'Splunk', ats: 'greenhouse', slugs: ['splunk', 'splunkinc', 'splunkcareers'] },
  { company: 'ThoughtSpot', ats: 'greenhouse', slugs: ['thoughtspot', 'thoughtspotinc', 'thoughtspotcareers'] },
  { company: 'Cohesity', ats: 'greenhouse', slugs: ['cohesity', 'cohesityinc', 'cohesitycareers'] },
  { company: 'BrowserStack', ats: 'greenhouse', slugs: ['browserstack', 'browserstackinc', 'browserstacksoftware', 'browserstackcareers'] },
  { company: 'Plivo', ats: 'greenhouse', slugs: ['plivo', 'plivoinc', 'plivocareers'] },
  { company: 'Hasura', ats: 'greenhouse', slugs: ['hasura', 'hasurainc', 'hasuraio'] },
  { company: 'Sourcegraph', ats: 'greenhouse', slugs: ['sourcegraph', 'sourcegraphinc', 'sourcegraphcareers'] },
  { company: 'Retool', ats: 'greenhouse', slugs: ['retool', 'retoolinc', 'retoolcareers'] },
  { company: 'Wiz', ats: 'greenhouse', slugs: ['wiz', 'wizio', 'wizsec', 'wizcloud', 'wizcareers'] },
  { company: 'Benchling', ats: 'greenhouse', slugs: ['benchling', 'benchlinginc', 'benchlingcareers'] },
  { company: 'Snyk', ats: 'greenhouse', slugs: ['snyk', 'snykinc', 'snykio', 'snyksec'] },
  { company: 'HashiCorp', ats: 'greenhouse', slugs: ['hashicorp', 'hashicorpinc', 'hashicorpcareers'] },
  { company: 'GitHub', ats: 'greenhouse', slugs: ['github', 'githubinc', 'githubcareers'] },
  { company: 'DigitalOcean', ats: 'greenhouse', slugs: ['digitalocean', 'digitaloceaninc', 'digitaloceancareers'] },
  { company: 'Nutanix', ats: 'greenhouse', slugs: ['nutanix', 'nutanixinc', 'nutanixcareers'] },
  { company: 'Palo Alto Networks', ats: 'greenhouse', slugs: ['paloaltonetworks', 'paloaltonetworksinc', 'panw'] },
  { company: 'Varonis', ats: 'greenhouse', slugs: ['varonis', 'varonisinc', 'varoniscareers'] },
  { company: 'SentinelOne', ats: 'greenhouse', slugs: ['sentinelone', 'sentineloneinc', 'sentinelonecareers'] },
  { company: 'CrowdStrike', ats: 'greenhouse', slugs: ['crowdstrike', 'crowdstrikeinc', 'crowdstrikecareers'] },
  { company: 'F5', ats: 'greenhouse', slugs: ['f5', 'f5networks', 'f5inc'] },
  { company: 'NetApp', ats: 'greenhouse', slugs: ['netapp', 'netappinc', 'netappcareers'] },
  { company: 'Zeta', ats: 'greenhouse', slugs: ['zeta', 'zetatech', 'zetaglobal', 'zetainc', 'zetasuite'] },
  { company: 'Razorpay', ats: 'greenhouse', slugs: ['razorpay', 'razorpayinc', 'razorpaysoftware', 'razorpaycareers'] },
  { company: 'Chargebee', ats: 'greenhouse', slugs: ['chargebee', 'chargebeeinc', 'chargebeecareers'] },
  { company: 'Yellow.ai', ats: 'greenhouse', slugs: ['yellowai', 'yellowdotai', 'yellowinc', 'yellowaicareers'] },

  // Lever candidates
  { company: 'Urban Company', ats: 'lever', slugs: ['urbancompany', 'urbanclap', 'urbancompany-2', 'urbancompanycareers'] },
  { company: 'Delhivery', ats: 'lever', slugs: ['delhivery', 'delhivery-2', 'delhiveryexpress', 'delhiverycareers'] },
  { company: 'Apollo.io', ats: 'lever', slugs: ['apolloio', 'apollo-io', 'apollo', 'apolloplatform'] },
  { company: 'Mixpanel', ats: 'lever', slugs: ['mixpanel', 'mixpanel-inc', 'mixpanelcareers'] },
  { company: 'Clear (ClearTax)', ats: 'lever', slugs: ['clear', 'cleartax', 'clear-in', 'cleartaxcareers'] },
  { company: 'Slice', ats: 'lever', slugs: ['slice', 'slicepay', 'sliceit', 'slicecareers'] },
  { company: 'Lenskart', ats: 'lever', slugs: ['lenskart', 'lenskart-2', 'lenskartcareers'] },
  { company: 'Kuku FM', ats: 'lever', slugs: ['kukufm', 'kuku-fm', 'kukufmcareers'] },
  { company: 'HyperVerge', ats: 'lever', slugs: ['hyperverge', 'hyperverge-co', 'hypervergeinc'] },
  { company: 'Unacademy', ats: 'lever', slugs: ['unacademy', 'unacademy-2', 'unacademycareers'] },
  { company: 'Cars24', ats: 'lever', slugs: ['cars24', 'cars24-2', 'cars24careers'] },
  { company: 'Smallcase', ats: 'lever', slugs: ['smallcase', 'smallcase-2', 'smallcasecareers'] },

  // Ashby candidates
  { company: 'DevRev', ats: 'ashby', slugs: ['devrev', 'devrev-ai', 'devrevai', 'devrevcareers'] },
  { company: 'Framer', ats: 'ashby', slugs: ['framer', 'framer-inc', 'framercareers'] },
  { company: 'Fly.io', ats: 'ashby', slugs: ['flyio', 'fly-io', 'fly'] },
  { company: 'Voiceflow', ats: 'ashby', slugs: ['voiceflow', 'voiceflow-inc'] },
  { company: 'Pydantic', ats: 'ashby', slugs: ['pydantic', 'pydantic-dev'] },

  // Recruitee candidates
  { company: 'MessageBird', ats: 'recruitee', slugs: ['messagebird', 'bird'] },
  { company: 'Usercentrics', ats: 'recruitee', slugs: ['usercentrics'] }
];

async function main() {
  console.log('Discovering actual working slugs for Wave 1B candidates...\n');
  const found: any[] = [];

  for (const item of candidateSlugs) {
    for (const slug of item.slugs) {
      try {
        let jobs: RawATSJob[] = [];
        if (item.ats === 'greenhouse') jobs = await fetchGreenhouseJobs(slug);
        else if (item.ats === 'lever') jobs = await fetchLeverJobs(slug);
        else if (item.ats === 'ashby') jobs = await fetchAshbyJobs(slug);
        else if (item.ats === 'smartrecruiters') jobs = await fetchSmartRecruitersJobs(slug);
        else if (item.ats === 'recruitee') jobs = await fetchRecruiteeJobs(slug);

        console.log(`🎉 FOUND MATCH! ${item.company} -> ATS: ${item.ats}, Working Slug: "${slug}", India Jobs: ${jobs.length}`);
        found.push({ company: item.company, ats: item.ats, slug, jobsCount: jobs.length });
        break;
      } catch (err) {
        // ignore
      }
    }
  }

  console.log('\n==================================================');
  console.log('RECOVERED WAVE 1B ATS IDENTIFIERS');
  console.log('==================================================');
  console.table(found);
}

main();
