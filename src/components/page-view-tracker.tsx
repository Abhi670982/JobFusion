'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function PageViewTracker() {
  const pathname = usePathname();
  const { user } = useUser();

  useEffect(() => {
    if (!pathname) return;

    // Fire-and-forget — never blocks user experience
    fetch('/api/admin/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, userId: user?.id || null }),
      keepalive: true,
    }).catch(() => {/* silently ignore errors */});
  }, [pathname, user?.id]);

  return null;
}
