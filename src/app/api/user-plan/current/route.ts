import { NextResponse } from 'next/server';
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
import { requireAuthUser, safeErrorResponse } from '@/lib/security';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

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
          savedJobs: { used: 0, limit: 20 },
        },
      }
    });
  } catch (error) {
    return safeErrorResponse(error, "Failed to retrieve subscription details");
  }
}
