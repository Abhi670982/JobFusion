'use client';

import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();

  // Check if current route is a landing/auth page (no sidebar/navbar wrapper)
  const isPortalRoute = !['/sign-in', '/sign-up', '/onboarding', '/auth', '/test-upload', '/'].some(
    (path) => pathname === path || (path !== '/' && pathname.startsWith(path + '/'))
  );

  if (!isPortalRoute) {
    return <>{children}</>;
  }

  // If user is not logged in, do not render the sidebar
  if (isLoaded && !isSignedIn) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-y-auto mobile-header-offset page-content scrollbar-thin">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
