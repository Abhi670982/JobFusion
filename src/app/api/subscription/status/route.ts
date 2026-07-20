// ============================================================
// /api/subscription/status — Get subscription status summary
// ============================================================
// PLACEHOLDER: Returns mocked status.
// TODO (Dodo Integration): This route will also handle
//   Dodo webhook events to update subscription status in DB.
// ============================================================

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // MOCK STATUS — replace with real DB query when Dodo is integrated
    const mockStatus = {
      isActive: true,
      isPro: false,
      planId: 'free' as const,
      planName: 'Free',
      // Will be set by Dodo webhook when subscription is created
      renewsAt: null,
      cancelledAt: null,
    };

    return NextResponse.json({ status: mockStatus });
  } catch (error) {
    console.error('[API /subscription/status]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
