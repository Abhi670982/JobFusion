import { NextRequest, NextResponse } from 'next/server';
import { DodoPayments } from 'dodopayments';
import { getOrCreateMongoUser } from '@/lib/auth-sync';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user via Clerk
    const user = await getOrCreateMongoUser();
    if (!user) {
      console.warn('[Dodo Payments Debug] Unauthorized request: User not authenticated.');
      return NextResponse.json(
        { success: false, error: 'You must be signed in to upgrade.' },
        { status: 401 }
      );
    }

    // 2. Parse and validate body
    let body;
    try {
      body = await req.json();
    } catch {
      console.warn('[Dodo Payments Debug] Bad Request: Invalid JSON body.');
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { plan } = body;
    if (plan !== 'monthly' && plan !== 'yearly') {
      console.warn(`[Dodo Payments Debug] Bad Request: Invalid plan "${plan}" selected.`);
      return NextResponse.json(
        { success: false, error: 'Invalid plan selection. Choose monthly or yearly.' },
        { status: 400 }
      );
    }

    // 3. Resolve API Key (support DODO_API_KEY and DODO_PAYMENTS_API_KEY)
    const apiKey = process.env.DODO_API_KEY || process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      console.error('[Dodo Payments Debug] Error: API Key is missing in environment variables (checked DODO_API_KEY and DODO_PAYMENTS_API_KEY).');
      return NextResponse.json(
        { success: false, error: 'Configuration error: API key is not configured.' },
        { status: 500 }
      );
    }
    console.log('[Dodo Payments Debug] API Key loaded successfully. Prefix:', apiKey.substring(0, 6));

    // 4. Resolve Product ID (support DODO_MONTHLY_PRODUCT_ID/DODO_YEARLY_PRODUCT_ID and NEXT_PUBLIC_ prefixes)
    const monthlyProdId = process.env.DODO_MONTHLY_PRODUCT_ID || process.env.NEXT_PUBLIC_DODO_MONTHLY_PRODUCT_ID;
    const yearlyProdId = process.env.DODO_YEARLY_PRODUCT_ID || process.env.NEXT_PUBLIC_DODO_YEARLY_PRODUCT_ID;
    const productId = plan === 'monthly' ? monthlyProdId : yearlyProdId;

    if (!productId) {
      console.error(`[Dodo Payments Debug] Error: Product ID is missing in environment variables for plan: ${plan}.`);
      console.error('[Dodo Payments Debug] Current Environment Variables status:', {
        DODO_MONTHLY_PRODUCT_ID: !!process.env.DODO_MONTHLY_PRODUCT_ID,
        NEXT_PUBLIC_DODO_MONTHLY_PRODUCT_ID: !!process.env.NEXT_PUBLIC_DODO_MONTHLY_PRODUCT_ID,
        DODO_YEARLY_PRODUCT_ID: !!process.env.DODO_YEARLY_PRODUCT_ID,
        NEXT_PUBLIC_DODO_YEARLY_PRODUCT_ID: !!process.env.NEXT_PUBLIC_DODO_YEARLY_PRODUCT_ID,
      });
      return NextResponse.json(
        { success: false, error: `Configuration error: Product ID not configured for plan "${plan}".` },
        { status: 500 }
      );
    }
    console.log(`[Dodo Payments Debug] Selected Product ID for plan "${plan}":`, productId);

    // 5. Initialize Dodo Payments client
    const client = new DodoPayments({
      bearerToken: apiKey,
      environment: 'test_mode',
    });

    // 6. Build dynamic return URL
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

    console.log('[Dodo Payments Debug] Sending Request Payload to Dodo:', JSON.stringify(payload, null, 2));

    // 7. Create checkout session
    let session;
    try {
      session = await client.checkoutSessions.create(payload);
      console.log('[Dodo Payments Debug] Dodo API Response Success:', JSON.stringify(session, null, 2));
    } catch (sdkError: any) {
      console.error('[Dodo Payments Debug] Dodo API Request Failed.');
      console.error('[Dodo Payments Debug] HTTP Status Code:', sdkError.status || sdkError.statusCode || 'N/A');
      console.error('[Dodo Payments Debug] Error Message:', sdkError.message);
      console.error('[Dodo Payments Debug] Full SDK Error Object:', {
        name: sdkError.name,
        message: sdkError.message,
        status: sdkError.status,
        headers: sdkError.headers,
        error: sdkError.error,
      });

      return NextResponse.json(
        { 
          success: false, 
          error: sdkError.message || 'The payment provider rejected the checkout creation request.' 
        },
        { status: sdkError.status || 502 }
      );
    }

    if (!session || !session.checkout_url) {
      console.error('[Dodo Payments Debug] Error: Dodo did not return a checkout_url.', session);
      return NextResponse.json(
        { success: false, error: 'Checkout URL was not returned by the payment gateway.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      checkout_url: session.checkout_url,
    });
  } catch (error: any) {
    console.error('[Dodo Payments Debug] Unhandled exception in create-checkout API:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected internal server error occurred while creating checkout.' },
      { status: 500 }
    );
  }
}
