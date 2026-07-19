const fs = require('fs');
const path = require('path');

const filesToClean = [
  'src/lib/auth-sync.ts',
  'src/app/api/users/route.ts',
  'src/app/api/admin/users/[id]/route.ts',
  'src/app/api/admin/users/route.ts',
  'src/app/api/admin/settings/route.ts',
  'src/app/api/admin/companies/route.ts',
  'src/app/api/jobs/route.ts',
  'src/app/api/saved-jobs/route.ts',
  'src/app/api/applications/route.ts',
  'src/app/api/admin/jobs/route.ts',
  'src/lib/pipeline.ts',
  'src/lib/scheduler.ts',
  'src/app/api/profile/route.ts',
  'src/app/api/parse-resume/route.ts',
  'src/app/api/profile/extract-details/route.ts',
  'src/app/api/upload-avatar/route.ts',
  'src/app/api/upload-resume/route.ts',
  'src/lib/audit-logger.ts',
  'src/app/api/admin/notifications/route.ts',
  'src/app/api/admin/contact-messages/route.ts',
  'src/app/api/contact/route.ts',
  'src/app/api/admin/system-health/route.ts',
  'src/app/api/admin/admins/route.ts',
  'src/app/api/admin/admins/[id]/route.ts',
  'src/app/api/admin/reports/[id]/route.ts',
  'src/app/api/jobs/match/route.ts',
  'src/app/api/admin/track-visit/route.ts',
  'src/app/api/dashboard/activity/route.ts'
];

function cleanFile(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(absolutePath, 'utf8');
  const originalLength = content.length;

  // 1. Remove imports of models
  content = content.replace(/import\s+[A-Za-z0-9_{}\s,]+\s+from\s+["']@\/models\/[A-Za-z0-9_]+["'];?\r?\n/g, '');
  content = content.replace(/import\s+[A-Za-z0-9_{}\s,]+\s+from\s+["']\.\.\/models\/[A-Za-z0-9_]+["'];?\r?\n/g, '');

  // 2. Remove imports of connectDB
  content = content.replace(/import\s+\{\s*connectDB\s*\}\s+from\s+["']@\/lib\/mongodb["'];?\r?\n/g, '');
  content = content.replace(/import\s+\{\s*connectDB\s*\}\s+from\s+["']\.\.\/lib\/mongodb["'];?\r?\n/g, '');
  content = content.replace(/import\s+\{\s*connectDB\s*\}\s+from\s+["']\.\.\/\.\.\/lib\/mongodb["'];?\r?\n/g, '');

  // 3. Remove dual-write MongoDB try/catch blocks
  // Matches try { await connectDB(); ... } catch (mongoErr) { ... }
  content = content.replace(/(\s*)\/\/\s*(?:Mirror|Dual-write|Sync|Write|Delete|Update|Create|Add|Remove)[^\n]*\r?\n\s*try\s*\{\s*(?:await\s+)?connectDB\(\);[\s\S]*?\}\s*catch\s*\((?:mongoErr|dbErr|err)\)\s*\{\s*console\.error\([\s\S]*?\);\s*\}/gi, '');
  content = content.replace(/(\s*)try\s*\{\s*(?:await\s+)?connectDB\(\);[\s\S]*?\}\s*catch\s*\((?:mongoErr|dbErr|err)\)\s*\{\s*console\.error\([\s\S]*?\);\s*\}/gi, '');

  if (content.length !== originalLength) {
    fs.writeFileSync(absolutePath, content, 'utf8');
    console.log(`Cleaned: ${filePath} (${originalLength - content.length} chars removed)`);
  } else {
    console.log(`No changes needed: ${filePath}`);
  }
}

console.log('Starting MongoDB code cleanup...');
filesToClean.forEach(cleanFile);
console.log('MongoDB code cleanup finished.');
