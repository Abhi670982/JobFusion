import { NextResponse } from 'next/server';
import { getCurrentPlan, hasProAccess, getPlanDisplayName } from '@/lib/subscription';
import { requireAuthUser, safeErrorResponse } from '@/lib/security';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

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
    return safeErrorResponse(error, "Failed to retrieve subscription status");
  }
}
