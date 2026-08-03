/**
 * Client-safe job portal classification helper.
 * Free portals (Accessible to EVERYONE - Free & Premium):
 * - LinkedIn ('linkedin')
 * - Wellfound ('wellfound')
 * - Company Career Pages ('careers', 'company_career', 'company_website', 'COMPANY_CAREER', etc.)
 *
 * Premium-only portals:
 * - Indeed ('indeed')
 * - Internshala ('internshala')
 * - Foundit ('foundit')
 * - Naukri ('naukri')
 * - Future Premium aggregators
 */
export function isPremiumPortal(source?: string | null, sourceCategory?: string | null): boolean {
  const normSource = (source || '').trim().toLowerCase();
  const normCat = (sourceCategory || '').trim().toUpperCase();

  // Free Portals: LinkedIn & Wellfound
  if (normSource === 'linkedin' || normSource === 'wellfound') {
    return false;
  }

  // Company Career Pages are FREE for everyone!
  if (
    normSource === 'careers' ||
    normSource === 'company_career' ||
    normSource === 'company_careers' ||
    normSource === 'company_website' ||
    normSource === 'careers_page' ||
    normCat === 'COMPANY_CAREER'
  ) {
    return false;
  }

  // Premium Portals: indeed, internshala, foundit, naukri, etc.
  return true;
}
