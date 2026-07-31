export {};

async function testFacets(company: string, host: string, tenant: string, siteId: string) {
  const url = `https://${host}/wday/cxs/${tenant}/${siteId}/jobs`;
  console.log(`\n=== Testing Location Filtering for ${company} (${url}) ===`);

  // 1. First fetch facets definition
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ searchText: '', appliedFacets: {}, limit: 20, offset: 0 }),
    });

    if (!res.ok) {
      console.log(`HTTP Error ${res.status}`);
      return;
    }

    const data = await res.json();
    console.log(`Total Global Jobs: ${data.total}`);
    const facets = data.facets || [];
    console.log(`Facets available (${facets.length}):`, facets.map((f: any) => f.facetParameter));

    // Look for locationCountry facet
    const locCountryFacet = facets.find((f: any) => f.facetParameter === 'locationCountry' || f.facetParameter === 'locationHierarchy1');
    if (locCountryFacet) {
      console.log(`Found Location Facet "${locCountryFacet.facetParameter}":`, locCountryFacet.values?.slice(0, 10));
      const indiaValue = locCountryFacet.values?.find((v: any) => v.descriptor?.toLowerCase().includes('india'));
      if (indiaValue) {
        console.log(`🎉 Found India Facet Value: ID=${indiaValue.id}, Descriptor="${indiaValue.descriptor}", Count=${indiaValue.count}`);

        // Now fetch with India facet applied!
        const indiaRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            searchText: '',
            appliedFacets: { [locCountryFacet.facetParameter]: [indiaValue.id] },
            limit: 20,
            offset: 0,
          }),
        });

        if (indiaRes.ok) {
          const indiaData = await indiaRes.json();
          console.log(`✅ SUCCESS WITH INDIA FACET! Total India Jobs: ${indiaData.total}`);
          if (indiaData.jobPostings?.length > 0) {
            console.log('   Sample India Job:', indiaData.jobPostings[0].title, '| Location:', indiaData.jobPostings[0].locationsText, '| Posted:', indiaData.jobPostings[0].postedOn);
          }
        }
      } else {
        console.log('No India facet value found under location facet');
      }
    } else {
      console.log('No locationCountry facet found in response');
    }
  } catch (err: any) {
    console.log('Error:', err.message);
  }
}

async function main() {
  await testFacets('Adobe', 'adobe.wd5.myworkdayjobs.com', 'adobe', 'external_experienced');
  await testFacets('NVIDIA', 'nvidia.wd5.myworkdayjobs.com', 'nvidia', 'NVIDIAExternalCareerSite');
  await testFacets('Autodesk', 'autodesk.wd1.myworkdayjobs.com', 'autodesk', 'Ext');
  await testFacets('Workday Inc', 'workday.wd5.myworkdayjobs.com', 'workday', 'Workday');
}

main();
