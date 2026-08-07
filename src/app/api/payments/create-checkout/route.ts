import { NextRequest, NextResponse } from 'next/server';
import { DodoPayments } from 'dodopayments';
import { requireAuthUser, safeErrorResponse } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { plan } = body;
    if (plan !== 'monthly' && plan !== 'yearly') {
      return NextResponse.json(
        { success: false, error: 'Invalid plan selection. Choose monthly or yearly.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DODO_API_KEY || process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      console.error('[Dodo Payments Debug] Error: API Key is missing in environment variables.');
      return NextResponse.json(
        { success: false, error: 'Configuration error: Payment gateway key is not configured.' },
        { status: 500 }
      );
    }

    const monthlyProdId = process.env.DODO_MONTHLY_PRODUCT_ID || process.env.NEXT_PUBLIC_DODO_MONTHLY_PRODUCT_ID;
    const yearlyProdId = process.env.DODO_YEARLY_PRODUCT_ID || process.env.NEXT_PUBLIC_DODO_YEARLY_PRODUCT_ID;
    const productId = plan === 'monthly' ? monthlyProdId : yearlyProdId;

    if (!productId) {
      console.error(`[Dodo Payments Debug] Error: Product ID is missing for plan: ${plan}.`);
      return NextResponse.json(
        { success: false, error: `Configuration error: Product ID not configured for plan "${plan}".` },
        { status: 500 }
      );
    }

    const client = new DodoPayments({
      bearerToken: apiKey,
      environment: 'test_mode',
    });

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const returnUrl = `${origin}/pricing/success`;

    const payload = {
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        email: user.email,
        name: user.fullName || 'User',
      },
      metadata: {
        clerkUserId: user.clerkId || "",
      },
      return_url: returnUrl,
    };

    let session;
    try {
      session = await client.checkoutSessions.create(payload);
    } catch (sdkError: any) {
      console.error('[Dodo Payments Debug] Dodo API Request Failed:', sdkError.message || sdkError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'The payment provider rejected the checkout creation request.' 
        },
        { status: 502 }
      );
    }

    if (!session || !session.checkout_url) {
      return NextResponse.json(
        { success: false, error: 'Checkout URL was not returned by the payment gateway.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      checkout_url: session.checkout_url,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to create payment checkout session");
  }
}
