import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateMongoUser } from '@/lib/auth-sync';
import { prisma } from '@/lib/prisma';

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

    // Find user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription) {
      return NextResponse.json({ payments: [] });
    }

    // Query payments history
    const payments = await prisma.payment.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('[API /subscription/payments]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
