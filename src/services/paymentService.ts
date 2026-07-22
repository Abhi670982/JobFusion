import { prisma } from "@/lib/prisma";

export interface RecordPaymentPayload {
  clerkUserId?: string | null;
  email?: string | null;
  dodoCustomerId: string;
  dodoSubscriptionId: string;
  providerPaymentId: string;
  amount: number; // in paise
  currency: string;
  status: "paid" | "failed" | "pending";
  metadata?: any;
}

export async function recordPayment(payload: RecordPaymentPayload) {
  // Find user first
  let user = null;
  if (payload.clerkUserId) {
    user = await prisma.user.findUnique({
      where: { clerkId: payload.clerkUserId },
    });
  }

  if (!user && payload.email) {
    user = await prisma.user.findUnique({
      where: { email: payload.email },
    });
  }

  if (!user) {
    throw new Error(`User not found for payment. clerkUserId: ${payload.clerkUserId}, email: ${payload.email}`);
  }

  // Find user's subscription
  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  if (!subscription) {
    throw new Error(`Subscription not found for user: ${user.email} (id: ${user.id}). Cannot link payment.`);
  }

  // Record payment in the database
  const payment = await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      amount: payload.amount,
      currency: payload.currency,
      status: payload.status,
      paymentProvider: "dodo",
      providerPaymentId: payload.providerPaymentId,
      metadata: payload.metadata || {},
    },
  });

  console.log(`[Payment Service] Recorded payment ${payload.status} for subscription ${subscription.id}, amount: ${payload.amount}`);
  return payment;
}
