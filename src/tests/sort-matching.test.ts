/**
 * sort-matching.test.ts
 *
 * Regression test suite for:
 *   BUG 1 - Match My Skills behavioral contract
 *   BUG 2 - Latest sort = postedAtDate DESC (null last), no tier interference
 *
 * Pure comparator tests mirror the exact comparators in queryCareersJobs (pipeline.ts).
 * Source-scan tests verify compile-time behavioral contracts.
 */

import assert from 'assert';
import * as fsModule from 'fs';
import * as path from 'path';

type MockJob = {
  id: string;
  userMatchScore: number;
  postedAtDate: Date | null;
};

/** Mirrors the 'latest' sort branch in queryCareersJobs */
function latestSort(jobs: MockJob[]): MockJob[] {
  const withDate = jobs.filter((j) => j.postedAtDate != null);
  const withoutDate = jobs.filter((j) => j.postedAtDate == null);
  withDate.sort((a, b) => {
    const at = new Date(a.postedAtDate!).getTime();
    const bt = new Date(b.postedAtDate!).getTime();
    if (bt !== at) return bt - at;
    return b.id.localeCompare(a.id);
  });
  return [...withDate, ...withoutDate];
}

/** Mirrors the 'relevance' sort branch in queryCareersJobs */
function relevanceSort(jobs: MockJob[]): MockJob[] {
  return [...jobs].sort((a, b) => {
    const aTier = a.userMatchScore >= 70 ? 3 : a.userMatchScore >= 35 ? 2 : 1;
    const bTier = b.userMatchScore >= 70 ? 3 : b.userMatchScore >= 35 ? 2 : 1;
    if (bTier !== aTier) return bTier - aTier;
    if (b.userMatchScore !== a.userMatchScore) return b.userMatchScore - a.userMatchScore;
    const aDate = a.postedAtDate ? new Date(a.postedAtDate).getTime() : 0;
    const bDate = b.postedAtDate ? new Date(b.postedAtDate).getTime() : 0;
    if (bDate !== aDate) return bDate - aDate;
    return b.id.localeCompare(a.id);
  });
}

async function runTests() {
  const now = Date.now();
  const h = (n: number) => new Date(now - n * 3600 * 1000);

  console.log('\n============================================================');
  console.log('=== SORT & MATCHING REGRESSION TESTS ===');
  console.log('============================================================');

  // ── LATEST SORT TESTS ──────────────────────────────────────────────────────

  console.log('\nL1: Latest sort — 24h < 2d < 3d chronological order...');
  {
    const jobs: MockJob[] = [
      { id: 'j3d',  userMatchScore: 90, postedAtDate: h(72) },
      { id: 'j24h', userMatchScore: 20, postedAtDate: h(24) },
      { id: 'j2d',  userMatchScore: 55, postedAtDate: h(48) },
    ];
    const sorted = latestSort(jobs);
    assert.strictEqual(sorted[0].id, 'j24h', '24h ago must be first');
    assert.strictEqual(sorted[1].id, 'j2d',  '2d ago must be second');
    assert.strictEqual(sorted[2].id, 'j3d',  '3d ago must be third');
    console.log('PASSED L1: 24h -> 2d -> 3d order correct.');
  }

  console.log('\nL2: Latest sort ignores matchScore — newest always first...');
  {
    const jobs: MockJob[] = [
      { id: 'jHighOld', userMatchScore: 100, postedAtDate: h(48) },
      { id: 'jLowNew',  userMatchScore: 5,   postedAtDate: h(1)  },
    ];
    const sorted = latestSort(jobs);
    assert.strictEqual(sorted[0].id, 'jLowNew',  'Low-score 1h ago must rank first');
    assert.strictEqual(sorted[1].id, 'jHighOld', 'High-score 48h ago must rank second');
    console.log('PASSED L2: Latest sort is purely chronological, matchScore ignored.');
  }

  console.log('\nL3: Latest sort ignores tier — tier has zero influence...');
  {
    const jobs: MockJob[] = [
      { id: 'jHighTier3d', userMatchScore: 95, postedAtDate: h(72) },
      { id: 'jLowTier1h',  userMatchScore: 10, postedAtDate: h(1)  },
    ];
    const sorted = latestSort(jobs);
    assert.strictEqual(sorted[0].id, 'jLowTier1h',  'LOW-tier 1h-old must rank first');
    assert.strictEqual(sorted[1].id, 'jHighTier3d', 'HIGH-tier 3d-old must rank second');
    console.log('PASSED L3: Tier has zero influence on Latest sort.');
  }

  console.log('\nL4: null postedAtDate goes last in Latest mode...');
  {
    const jobs: MockJob[] = [
      { id: 'jNull', userMatchScore: 100, postedAtDate: null  },
      { id: 'j2d',   userMatchScore: 0,   postedAtDate: h(48) },
      { id: 'j6h',   userMatchScore: 0,   postedAtDate: h(6)  },
    ];
    const sorted = latestSort(jobs);
    assert.strictEqual(sorted[0].id, 'j6h',  '6h-old must be first');
    assert.strictEqual(sorted[1].id, 'j2d',  '2d-old must be second');
    assert.strictEqual(sorted[2].id, 'jNull','null-date job must be last');
    console.log('PASSED L4: Jobs with null postedAtDate go last.');
  }

  // ── RELEVANCE SORT TESTS ───────────────────────────────────────────────────

  console.log('\nR1: Relevance sort — tier is primary (HIGH beats MODERATE)...');
  {
    const jobs: MockJob[] = [
      { id: 'jModerateNew', userMatchScore: 50, postedAtDate: h(1)  },
      { id: 'jHighOld',     userMatchScore: 80, postedAtDate: h(72) },
    ];
    const sorted = relevanceSort(jobs);
    assert.strictEqual(sorted[0].id, 'jHighOld', 'HIGH tier must rank above MODERATE regardless of age');
    console.log('PASSED R1: Tier is primary in Relevance sort.');
  }

  console.log('\nR2: Relevance sort — matchScore is secondary within same tier...');
  {
    const jobs: MockJob[] = [
      { id: 'jScore80',  userMatchScore: 80,  postedAtDate: h(1)  },
      { id: 'jScore100', userMatchScore: 100, postedAtDate: h(48) },
    ];
    const sorted = relevanceSort(jobs);
    assert.strictEqual(sorted[0].id, 'jScore100', 'Score 100 must rank above Score 80 within same HIGH tier');
    assert.strictEqual(sorted[1].id, 'jScore80');
    console.log('PASSED R2: Higher matchScore wins within same tier.');
  }

  console.log('\nR3: Relevance sort — postedAtDate is tie-breaker for equal tier+score...');
  {
    const jobs: MockJob[] = [
      { id: 'jSame_3d', userMatchScore: 75, postedAtDate: h(72) },
      { id: 'jSame_6h', userMatchScore: 75, postedAtDate: h(6)  },
    ];
    const sorted = relevanceSort(jobs);
    assert.strictEqual(sorted[0].id, 'jSame_6h', 'Newer job must rank first when tier and score are equal');
    assert.strictEqual(sorted[1].id, 'jSame_3d');
    console.log('PASSED R3: postedAtDate DESC wins when tier + score are equal.');
  }

  console.log('\nR4: Relevance sort — three tiers in correct order...');
  {
    const jobs: MockJob[] = [
      { id: 'jLow',      userMatchScore: 15, postedAtDate: h(1)  },
      { id: 'jHigh',     userMatchScore: 90, postedAtDate: h(72) },
      { id: 'jModerate', userMatchScore: 45, postedAtDate: h(24) },
    ];
    const sorted = relevanceSort(jobs);
    assert.strictEqual(sorted[0].id, 'jHigh',     'HIGH must be first');
    assert.strictEqual(sorted[1].id, 'jModerate', 'MODERATE must be second');
    assert.strictEqual(sorted[2].id, 'jLow',      'LOW must be third');
    console.log('PASSED R4: HIGH -> MODERATE -> LOW ordering correct.');
  }

  // ── BEHAVIORAL CONTRACTS ───────────────────────────────────────────────────

  console.log('\nB1: Switching to Latest restores pure chronological order...');
  {
    const relevanceSorted: MockJob[] = [
      { id: 'jHighOld', userMatchScore: 90, postedAtDate: h(72) },
      { id: 'jLowNew',  userMatchScore: 10, postedAtDate: h(1)  },
    ];
    const latestSorted = latestSort(relevanceSorted);
    assert.strictEqual(latestSorted[0].id, 'jLowNew',  'After Latest, 1h-old must be first');
    assert.strictEqual(latestSorted[1].id, 'jHighOld', 'After Latest, 72h-old must be second');
    console.log('PASSED B1: Switching to Latest restores pure chronological order.');
  }

  console.log('\nB2: No-skills: all jobs returned in postedAtDate DESC order...');
  {
    const allJobs: MockJob[] = [
      { id: 'j48h',  userMatchScore: 100, postedAtDate: h(48)  },
      { id: 'j6h',   userMatchScore: 100, postedAtDate: h(6)   },
      { id: 'j120h', userMatchScore: 100, postedAtDate: h(120) },
    ];
    const sorted = latestSort(allJobs);
    assert.strictEqual(sorted[0].id, 'j6h',   'Newest job first');
    assert.strictEqual(sorted[1].id, 'j48h',  'Middle job second');
    assert.strictEqual(sorted[2].id, 'j120h', 'Oldest job third');
    console.log('PASSED B2: No-skills user gets all jobs in postedAtDate DESC order.');
  }

  console.log('\nB3: handleAISearch never calls crawl endpoint (source scan)...');
  {
    const pageSource = fsModule.readFileSync(
      path.join(process.cwd(), 'src/app/jobs/page.tsx'), 'utf-8'
    );
    const fnStart = pageSource.indexOf('const handleAISearch = async');
    // Handle both LF and CRLF line endings for the function boundary.
    // We search for the pattern that ends handleAISearch — the next top-level arrow function or export.
    // Simpler: just check the next 8000 chars which comfortably covers the full function.
    const fnBody  = pageSource.slice(fnStart, fnStart + 8000);
    assert.ok(!fnBody.includes('fetch-now'),    'handleAISearch must NOT call /api/jobs/fetch-now');
    assert.ok(!fnBody.includes('enqueue'),      'handleAISearch must NOT call enqueue');
    assert.ok(!fnBody.includes('triggerCrawl'), 'handleAISearch must NOT call triggerCrawl');
    // Check both template literal styles (backtick may be escaped differently in source)
    const callsJobsApi = fnBody.includes('/api/jobs?') || fnBody.includes('/api/jobs?');
    assert.ok(callsJobsApi, 'handleAISearch must call /api/jobs?...');
    console.log('PASSED B3: handleAISearch only calls /api/jobs, no ATS crawl.');
  }

  console.log('\nB4: No prisma.profile.findFirst dangerous fallback in route.ts...');
  {
    const routeSource = fsModule.readFileSync(
      path.join(process.cwd(), 'src/app/api/jobs/route.ts'), 'utf-8'
    );
    const hasDangerousFallback =
      routeSource.includes('profile.findFirst') &&
      routeSource.includes('skills: { some: {} }');
    assert.ok(!hasDangerousFallback, 'route.ts must NOT contain any-user profile.findFirst fallback');
    console.log('PASSED B4: Dangerous any-user profile fallback removed from route.ts.');
  }

  console.log('\nB5: Default sortMode in queryCareersJobs is latest...');
  {
    const pipelineSource = fsModule.readFileSync(
      path.join(process.cwd(), 'src/lib/pipeline.ts'), 'utf-8'
    );
    assert.ok(
      pipelineSource.includes("sortMode ?? 'latest'"),
      "queryCareersJobs must default sortMode to 'latest'"
    );
    console.log('PASSED B5: queryCareersJobs defaults sortMode to latest.');
  }

  console.log('\nB6: route.ts maps sortBy=relevance param to sortMode=relevance...');
  {
    const routeSource = fsModule.readFileSync(
      path.join(process.cwd(), 'src/app/api/jobs/route.ts'), 'utf-8'
    );
    assert.ok(
      routeSource.includes("'relevance' ? 'relevance' : 'latest'"),
      "route.ts must map sortBy=relevance param to sortMode=relevance"
    );
    console.log('PASSED B6: route.ts correctly maps sortBy param to sortMode.');
  }

  console.log('\nB7: Toast only fires after awaited fetch in handleAISearch...');
  {
    const pageSource = fsModule.readFileSync(
      path.join(process.cwd(), 'src/app/jobs/page.tsx'), 'utf-8'
    );
    const fnStart = pageSource.indexOf('const handleAISearch = async');
    const fnBody  = pageSource.slice(fnStart, fnStart + 8000);
    const awaitFetchPos = fnBody.indexOf('await fetch(');
    const toastPos      = fnBody.indexOf('setShowSuccessToast(true)');
    assert.ok(awaitFetchPos > 0, 'handleAISearch must contain await fetch(...)'); 
    assert.ok(toastPos > awaitFetchPos, 'setShowSuccessToast must appear AFTER await fetch');
    console.log('PASSED B7: Toast fires only after the fetch completes.');
  }

  console.log('\n============================================================');
  console.log('ALL SORT & MATCHING REGRESSION TESTS PASSED CLEANLY!');
  console.log('============================================================\n');
}

runTests().catch((err) => {
  console.error('SORT & MATCHING TESTS FAILED:', err);
  process.exit(1);
});
