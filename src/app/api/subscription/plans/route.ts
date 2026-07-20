// ============================================================
// /api/subscription/plans — Get all available plans
// ============================================================
// Returns the config-driven plan list for the frontend.
// No payment logic — safe to call from any client.
// ============================================================

import { NextResponse } from 'next/server';
import { PLANS, FAQ_ITEMS, COMPARISON_ROWS } from '@/lib/plans';

export async function GET() {
  try {
    // Return the config-driven plans (from lib/plans.ts)
    // Strip out internal Dodo product IDs before sending to client
    const publicPlans = PLANS.map(({ dodoMonthlyProductId: _m, dodoYearlyProductId: _y, ...rest }) => rest);

    return NextResponse.json({
      plans: publicPlans,
      faq: FAQ_ITEMS,
      comparison: COMPARISON_ROWS,
    });
  } catch (error) {
    console.error('[API /subscription/plans]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
