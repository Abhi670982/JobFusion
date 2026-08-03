import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateMongoUser } from '@/lib/auth-sync';
import {
  getCurrentPlan,
  hasProAccess,
  canUseResumeAI,
  canGenerateCoverLetter,
  canUseInterviewPrep,
  canUseSmartMatch,
  getAIUsage,
  getPlanDisplayName
} from '@/lib/subscription';

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
    const resumeAIGate = await canUseResumeAI(user.id);
    const coverLetterGate = await canGenerateCoverLetter(user.id);
    const interviewPrepGate = await canUseInterviewPrep(user.id);
    const smartMatchGate = await canUseSmartMatch(user.id);
    const aiUsage = await getAIUsage(user.id);

    return NextResponse.json({
      subscription: {
        planId: plan.planId,
        planName: getPlanDisplayName(plan.planId),
        status: plan.status,
        interval: plan.interval,
        currentPeriodEnd: plan.currentPeriodEnd,
        cancelAtPeriodEnd: plan.cancelAtPeriodEnd,
        paymentProvider: plan.paymentProvider,
        customerId: plan.customerId,
        providerSubscriptionId: plan.providerSubscriptionId,
        features: {
          hasProAccess: proAccess,
          canUseResumeAI: resumeAIGate.allowed,
          canGenerateCoverLetter: coverLetterGate.allowed,
          canUseInterviewPrep: interviewPrepGate.allowed,
          canUseSmartMatch: smartMatchGate.allowed,
        },
        usage: {
          aiOperations: {
            used: aiUsage.used,
            limit: aiUsage.limit,
          },
          savedJobs: { used: 0, limit: 20 }, // placeholder limit as per current template
        },
      }
    });
  } catch (error) {
    console.error('[API /subscription/current]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
