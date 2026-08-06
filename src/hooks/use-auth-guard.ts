'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';

export function useAuthGuard() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Reusable authorization guard for authenticated features.
   * If user is signed in: executes the provided feature action.
   * If guest (not signed in): prevents the action and redirects to /sign-in preserving the original destination.
   */
  const requireAuth = (action: () => void | Promise<void>) => {
    if (isLoaded && !isSignedIn) {
      const currentPath = typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : pathname;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentPath)}`);
      return;
    }
    return action();
  };

  return {
    isSignedIn: !!isSignedIn,
    isLoaded,
    user,
    userId: user?.id,
    requireAuth,
  };
}
