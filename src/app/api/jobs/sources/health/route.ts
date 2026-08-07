import { NextResponse } from "next/server";
import { providerHealth } from "@/lib/provider-health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = providerHealth.getHealthReport();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      providers: report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve provider health" },
      { status: 500 }
    );
  }
}
