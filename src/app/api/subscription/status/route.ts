import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateMongoUser } from '@/lib/auth-sync';
import { getCurrentPlan, hasProAccess, getPlanDisplayName } from '@/lib/subscription';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateMongoUser();
    if (!user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const plan = await getCurrentPlan(user.id);
    const proAccess = await hasProAccess(user.id);

    return NextResponse.json({
      status: {
        isActive: plan.status === 'active' || plan.status === 'trialing',
        isPro: proAccess,
        planId: plan.planId,
        planName: getPlanDisplayName(plan.planId),
        renewsAt: plan.currentPeriodEnd,
        cancelledAt: plan.cancelAtPeriodEnd ? plan.currentPeriodEnd : null,
      }
    });
  } catch (error) {
    console.error('[API /subscription/status]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
