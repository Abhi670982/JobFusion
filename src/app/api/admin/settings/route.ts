import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/admin-auth";
import Settings from "@/models/Settings";
import Activity from "@/models/Activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    let settings = await Settings.findOne({ settingsId: "global" });
    if (!settings) {
      settings = await Settings.create({
        settingsId: "global",
        maintenanceMode: false,
        homepageAnnouncement: "",
        geminiKeyPlaceholder: "",
        featureFlags: {
          aiRecommendations: true,
          scraperEnabled: true,
          resumeParsing: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { maintenanceMode, homepageAnnouncement, geminiKeyPlaceholder, featureFlags, futureIntegrations } = body;

    let settings = await Settings.findOne({ settingsId: "global" });
    if (!settings) {
      settings = new Settings({ settingsId: "global" });
    }

    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (homepageAnnouncement !== undefined) settings.homepageAnnouncement = homepageAnnouncement;
    if (geminiKeyPlaceholder !== undefined) settings.geminiKeyPlaceholder = geminiKeyPlaceholder;
    if (featureFlags !== undefined) settings.featureFlags = featureFlags;
    if (futureIntegrations !== undefined) settings.futureIntegrations = futureIntegrations;

    await settings.save();

    // Log admin action using structured audit logger
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin,
      action: "Updated Settings",
      resource: "Settings",
      resourceId: "global",
      details: "Updated global platform settings and feature flags",
    });

    return NextResponse.json({
      success: true,
      message: "Platform settings updated successfully",
      data: settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
