import { fetchGreenhouseJobs, fetchLeverJobs, fetchAshbyJobs, fetchSmartRecruitersJobs, RawATSJob } from '../lib/adapters/ats-apis';

interface SlugCandidate {
  company: string;
  atsType: 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters';
  slugs: string[];
  careersUrl: string;
  category: string;
}

const targetCompanies: SlugCandidate[] = [
  { company: 'Atlassian', atsType: 'greenhouse', slugs: ['atlassian', 'atlassianinc', 'atlassiancareers', 'atlassiansoftware'], careersUrl: 'https://careers.atlassian.com/', category: 'Dev Tools' },
  { company: 'DoorDash', atsType: 'greenhouse', slugs: ['doordash', 'doordashinc', 'doordashcareers'], careersUrl: 'https://careers.doordash.com/', category: 'Delivery/Tech' },
  { company: 'Rippling', atsType: 'greenhouse', slugs: ['rippling', 'ripplinginc', 'ripplingcareers', 'ripplinghr'], careersUrl: 'https://www.rippling.com/careers', category: 'HR/Fintech' },
  { company: 'Zendesk', atsType: 'greenhouse', slugs: ['zendesk', 'zendeskinc', 'zendeskcareers'], careersUrl: 'https://www.zendesk.com/careers/', category: 'SaaS' },
  { company: 'Splunk', atsType: 'greenhouse', slugs: ['splunk', 'splunkinc', 'splunkcareers'], careersUrl: 'https://www.splunk.com/careers', category: 'Security/Data' },
  { company: 'ThoughtSpot', atsType: 'greenhouse', slugs: ['thoughtspot', 'thoughtspotinc', 'thoughtspotcareers'], careersUrl: 'https://www.thoughtspot.com/careers', category: 'Analytics' },
  { company: 'Cohesity', atsType: 'greenhouse', slugs: ['cohesity', 'cohesityinc', 'cohesitycareers'], careersUrl: 'https://www.cohesity.com/company/careers/', category: 'Data Security' },
  { company: 'BrowserStack', atsType: 'greenhouse', slugs: ['browserstack', 'browserstackinc', 'browserstacksoftware'], careersUrl: 'https://www.browserstack.com/careers', category: 'Dev Tools' },
  { company: 'Plivo', atsType: 'greenhouse', slugs: ['plivo', 'plivoinc', 'plivocareers'], careersUrl: 'https://www.plivo.com/careers/', category: 'API/Communications' },
  { company: 'Hasura', atsType: 'greenhouse', slugs: ['hasura', 'hasurainc', 'hasuraio'], careersUrl: 'https://hasura.io/careers/', category: 'GraphQL' },
  { company: 'Sourcegraph', atsType: 'greenhouse', slugs: ['sourcegraph', 'sourcegraphinc'], careersUrl: 'https://sourcegraph.com/jobs', category: 'Dev Tools' },
  { company: 'Retool', atsType: 'greenhouse', slugs: ['retool', 'retoolinc'], careersUrl: 'https://retool.com/careers', category: 'Dev Tools' },
  { company: 'Wiz', atsType: 'greenhouse', slugs: ['wiz', 'wizio', 'wizsec', 'wizcloud'], careersUrl: 'https://www.wiz.io/careers', category: 'Cloud Security' },
  { company: 'Snyk', atsType: 'greenhouse', slugs: ['snyk', 'snykinc', 'snykio'], careersUrl: 'https://snyk.io/careers/', category: 'DevSecOps' },
  { company: 'Razorpay', atsType: 'greenhouse', slugs: ['razorpay', 'razorpayinc', 'razorpaysftware'], careersUrl: 'https://razorpay.com/jobs/', category: 'Fintech/India' },
  { company: 'Chargebee', atsType: 'greenhouse', slugs: ['chargebee', 'chargebeeinc'], careersUrl: 'https://www.chargebee.com/careers/', category: 'SaaS/India' },
  { company: 'Urban Company', atsType: 'lever', slugs: ['urbancompany', 'urbanclap', 'urbancompany-2'], careersUrl: 'https://www.urbancompany.com/careers', category: 'Consumer Tech/India' },
  { company: 'Delhivery', atsType: 'lever', slugs: ['delhivery', 'delhivery-2', 'delhiveryexpress'], careersUrl: 'https://www.delhivery.com/careers', category: 'Logistics/India' },
  { company: 'Apollo.io', atsType: 'lever', slugs: ['apolloio', 'apollo-io', 'apollo'], careersUrl: 'https://www.apollo.io/careers', category: 'SaaS' },
  { company: 'Mixpanel', atsType: 'lever', slugs: ['mixpanel', 'mixpanel-inc'], careersUrl: 'https://mixpanel.com/jobs/', category: 'Analytics' },
  { company: 'DevRev', atsType: 'ashby', slugs: ['devrev', 'devrev-ai', 'devrevai'], careersUrl: 'https://devrev.ai/careers', category: 'Dev Tools/AI' },
  { company: 'Framer', atsType: 'ashby', slugs: ['framer', 'framer-inc'], careersUrl: 'https://www.framer.com/careers/', category: 'Design/Dev Tools' },
];

async function main() {
  console.log('Testing slug variations for candidates...\n');
  for (const item of targetCompanies) {
    for (const slug of item.slugs) {
      try {
        let jobs: RawATSJob[] = [];
        if (item.atsType === 'greenhouse') jobs = await fetchGreenhouseJobs(slug);
        else if (item.atsType === 'lever') jobs = await fetchLeverJobs(slug);
        else if (item.atsType === 'ashby') jobs = await fetchAshbyJobs(slug);
        else if (item.atsType === 'smartrecruiters') jobs = await fetchSmartRecruitersJobs(slug);

        console.log(`✅ MATCH! ${item.company} -> ATS: ${item.atsType}, Slug: "${slug}", India Jobs: ${jobs.length}`);
        break; // found working slug
      } catch (err: any) {
        // ignore 404
      }
    }
  }
}
main();
