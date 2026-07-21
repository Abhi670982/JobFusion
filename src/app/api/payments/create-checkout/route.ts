import { NextRequest, NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import { getOrCreateMongoUser } from '@/lib/auth-sync';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user via Clerk using auth-sync helper
    const user = await getOrCreateMongoUser();
    if (!user) {
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

    // 3. Resolve Product ID from environment variables
    const monthlyProdId = process.env.NEXT_PUBLIC_DODO_MONTHLY_PRODUCT_ID;
    const yearlyProdId = process.env.NEXT_PUBLIC_DODO_YEARLY_PRODUCT_ID;
    const productId = plan === 'monthly' ? monthlyProdId : yearlyProdId;

    if (!productId) {
      console.error(`[Dodo Payments] Product ID not configured in environment for tier: ${plan}`);
      return NextResponse.json(
        { success: false, error: 'Configuration error: Product ID not configured.' },
        { status: 500 }
      );
    }

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      console.error('[Dodo Payments] API Key not configured in environment (DODO_PAYMENTS_API_KEY).');
      return NextResponse.json(
        { success: false, error: 'Configuration error: API key not configured.' },
        { status: 500 }
      );
    }

    // 4. Initialize Dodo Payments client
    const client = new DodoPayments({
      bearerToken: apiKey,
      environment: 'test_mode',
    });

    // 5. Build dynamic return and cancellation URLs
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const returnUrl = `${origin}/pricing/success`;

    // 6. Create checkout session
    const session = await client.checkoutSessions.create({
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
      return_url: returnUrl,
    });

    if (!session || !session.checkout_url) {
      console.error('[Dodo Payments] Session creation failed or checkout_url missing.', session);
      return NextResponse.json(
        { success: false, error: 'Failed to generate checkout session from payment provider.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      checkout_url: session.checkout_url,
    });
  } catch (error: any) {
    console.error('[Dodo Payments] Error in create-checkout API:', error);
    // Generic error message to not leak internal API credentials or SDK stack traces
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while initiating payment.' },
      { status: 500 }
    );
  }
}
