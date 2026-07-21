import { Webhook } from "standardwebhooks";
import { prisma } from "@/lib/prisma";
import { syncSubscription } from "./subscriptionService";
import { recordPayment } from "./paymentService";

export async function verifyAndProcessWebhook(
  rawBody: string,
  headers: Record<string, string>
) {
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY || process.env.DODO_WEBHOOK_SECRET;

  if (!webhookKey) {
    console.error("[Webhook Service] Webhook signing key is not configured in environment variables.");
    throw new Error("Webhook signing key is not configured.");
  }

  // 1. Verify the signature
  const wh = new Webhook(webhookKey);
  try {
    wh.verify(rawBody, headers);
  } catch (err: any) {
    console.error("[Webhook Service] Signature verification failed:", err.message || err);
    throw new Error("Invalid signature");
  }

  // 2. Parse the payload
  const payload = JSON.parse(rawBody);
  const eventId = headers["webhook-id"];
  const eventType = payload.type;

  if (!eventId) {
    console.error("[Webhook Service] Missing webhook-id header.");
    throw new Error("Missing webhook-id header");
  }

  console.log(`[Webhook Service] Signature verified for event ID: ${eventId}, Type: ${eventType}`);

  // 3. Idempotency Check
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { eventId },
  });

  if (existingEvent) {
    if (existingEvent.processed) {
      console.log(`[Webhook Service] Event ${eventId} was already processed successfully. Skipping.`);
      return { success: true, duplicated: true };
    } else {
      console.warn(`[Webhook Service] Event ${eventId} was logged but not processed. Retrying process.`);
    }
  } else {
    // Log the event initially as unprocessed
    await prisma.webhookEvent.create({
      data: {
        eventId,
        eventType,
        payload,
        processed: false,
      },
    });
  }

  try {
    // 4. Process the event type
    switch (eventType) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.cancelled": {
        const subData = payload.data;
        const metadata = subData.metadata || {};
        
        await syncSubscription({
          clerkUserId: metadata.clerkUserId || null,
          email: subData.customer?.email || null,
          dodoCustomerId: subData.customer_id,
          dodoSubscriptionId: subData.subscription_id,
          checkoutSessionId: metadata.checkoutSessionId || null,
          productId: subData.product_id,
          status: subData.status,
          billingInterval: subData.billing_interval || null,
          currentPeriodStart: subData.current_period_start || null,
          currentPeriodEnd: subData.current_period_end || null,
          cancelAtPeriodEnd: !!subData.cancel_at_period_end,
        });
        break;
      }

      case "payment.succeeded": {
        const payData = payload.data;
        const metadata = payData.metadata || {};

        if (payData.subscription_id) {
          await recordPayment({
            clerkUserId: metadata.clerkUserId || null,
            email: payData.customer?.email || null,
            dodoCustomerId: payData.customer_id,
            dodoSubscriptionId: payData.subscription_id,
            providerPaymentId: payData.payment_id,
            amount: payData.amount || 0,
            currency: payData.currency || "INR",
            status: "paid",
            metadata,
          });
        } else {
          console.log(`[Webhook Service] Non-subscription payment succeeded (ID: ${payData.payment_id}). Ignoring.`);
        }
        break;
      }

      case "payment.failed": {
        const payData = payload.data;
        const metadata = payData.metadata || {};

        if (payData.subscription_id) {
          await recordPayment({
            clerkUserId: metadata.clerkUserId || null,
            email: payData.customer?.email || null,
            dodoCustomerId: payData.customer_id,
            dodoSubscriptionId: payData.subscription_id,
            providerPaymentId: payData.payment_id,
            amount: payData.amount || 0,
            currency: payData.currency || "INR",
            status: "failed",
            metadata,
          });
        }
        break;
      }

      default:
        console.log(`[Webhook Service] Ignored unknown event type: ${eventType}`);
        break;
    }

    // Mark event as processed
    await prisma.webhookEvent.update({
      where: { eventId },
      data: { processed: true },
    });

    return { success: true, processed: true };
  } catch (processError: any) {
    console.error(`[Webhook Service] Error processing event ${eventId}:`, processError.message || processError);
    
    // Record error in event log
    await prisma.webhookEvent.update({
      where: { eventId },
      data: { error: processError.message || String(processError) },
    });

    throw processError;
  }
}
