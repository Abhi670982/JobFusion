import { withPage } from './src/lib/browser-pool.ts';

withPage(async (page) => {
  console.log('success');
  return true;
}).catch(console.error).finally(() => process.exit());
