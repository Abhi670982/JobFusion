// ============================================================
// /api/subscription/current — Get current user's subscription
// ============================================================
// PLACEHOLDER: Returns mocked data.
// TODO (Dodo Integration): Fetch from DB using Clerk userId.
// ============================================================

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // MOCK RESPONSE — replace with real DB query when Dodo is integrated
    // Example:
    //   const sub = await prisma.subscription.findUnique({
    //     where: { userId: dbUser.id },
    //     include: { plan: true },
    //   });
    const mockSubscription = {
      planId: 'free' as const,
      planName: 'Free',
      status: 'active' as const,
      interval: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      // Payment provider fields — null until Dodo is integrated
      paymentProvider: null,
      customerId: null,
      providerSubscriptionId: null,
      // Feature gates
      features: {
        hasProAccess: false,
        canUseResumeAI: false,
        canGenerateCoverLetter: false,
        canUseInterviewPrep: false,
        canUseSmartMatch: false,
      },
      usage: {
        aiOperations: { used: 3, limit: 5 },
        savedJobs: { used: 0, limit: 20 },
      },
    };

    return NextResponse.json({ subscription: mockSubscription });
  } catch (error) {
    console.error('[API /subscription/current]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
