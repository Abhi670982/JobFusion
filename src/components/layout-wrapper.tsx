'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if current route is a landing/auth page (no sidebar/navbar wrapper)
  const isPortalRoute = !['/sign-in', '/sign-up', '/onboarding', '/auth', '/test-upload', '/'].some(
    (path) => pathname === path || (path !== '/' && pathname.startsWith(path + '/'))
  );

  if (!isPortalRoute) {
    return <>{children}</>;
  }

  const isRecruiter = pathname.startsWith('/recruiter') || pathname.startsWith('/candidates');

  return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden bg-background">
      <Sidebar isRecruiter={isRecruiter} />
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-y-auto mobile-header-offset page-content scrollbar-thin">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
