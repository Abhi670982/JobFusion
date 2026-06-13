import { NextRequest, NextResponse } from "next/server";
import { runSourceSync } from "@/lib/pipeline";
import { JobSource } from "@/lib/adapters/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source } = body;

    const validSources: JobSource[] = ["linkedin", "indeed", "wellfound", "internshala"];
    if (!source || !validSources.includes(source)) {
      return NextResponse.json(
        { success: false, error: `Invalid source. Must be one of: ${validSources.join(", ")}` },
        { status: 400 }
      );
    }

    const keywords = (process.env.FETCH_KEYWORDS || "software engineer,frontend developer,backend developer").split(",");
    
    console.log(`[FetchNow API] Immediate fetch triggered for source: ${source} with keywords: ${keywords.join(", ")}`);
    
    // Trigger the pipeline sync
    const result = await runSourceSync(source as JobSource, keywords);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synchronized jobs from ${source}.`,
        jobsFetchedCount: result.count,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || `Failed to synchronize jobs from ${source}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
