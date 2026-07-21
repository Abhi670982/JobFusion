import { NextRequest, NextResponse } from "next/server";
import { verifyAndProcessWebhook } from "@/services/webhookService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const headersList = req.headers;

  const webhookHeaders = {
    "webhook-id": headersList.get("webhook-id") || "",
    "webhook-signature": headersList.get("webhook-signature") || "",
    "webhook-timestamp": headersList.get("webhook-timestamp") || "",
  };

  try {
    const rawBody = await req.text();

    if (!webhookHeaders["webhook-id"] || !webhookHeaders["webhook-signature"]) {
      console.warn("[Webhook Route] Received request with missing verification headers.");
      return NextResponse.json({ error: "Missing required headers" }, { status: 400 });
    }

    const result = await verifyAndProcessWebhook(rawBody, webhookHeaders);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[Webhook Route] Exception in webhook execution:", error.message || error);
    return NextResponse.json(
      { error: error.message || "Internal Webhook Error" },
      { status: error.message === "Invalid signature" ? 401 : 500 }
    );
  }
}
