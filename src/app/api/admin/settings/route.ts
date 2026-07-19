import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    let settings = await prisma.settings.findUnique({
      where: { settingsId: "global" }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          settingsId: "global",
          maintenanceMode: false,
          homepageAnnouncement: "",
          geminiKeyPlaceholder: "",
          featureFlags: {
            aiRecommendations: true,
            scraperEnabled: true,
            resumeParsing: true,
          },
        },
      });

      // Maintain MongoDB parity
    }

    // Map to MongoDB-like representation
    const mappedSettings = {
      _id: settings.id,
      settingsId: settings.settingsId,
      maintenanceMode: settings.maintenanceMode,
      homepageAnnouncement: settings.homepageAnnouncement,
      geminiKeyPlaceholder: settings.geminiKeyPlaceholder,
      featureFlags: settings.featureFlags,
      futureIntegrations: settings.futureIntegrations,
      allowedAdminEmails: settings.allowedAdminEmails,
      contactEmail: settings.contactEmail,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: mappedSettings,
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

    const body = await req.json();
    const { maintenanceMode, homepageAnnouncement, geminiKeyPlaceholder, contactEmail, featureFlags, futureIntegrations } = body;

    if (contactEmail !== undefined && contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail.trim())) {
        return NextResponse.json({ success: false, error: "Invalid contact email format" }, { status: 400 });
      }
    }

    // Update PostgreSQL settings
    const settings = await prisma.settings.upsert({
      where: { settingsId: "global" },
      update: {
        maintenanceMode: maintenanceMode !== undefined ? maintenanceMode : undefined,
        homepageAnnouncement: homepageAnnouncement !== undefined ? homepageAnnouncement : undefined,
        geminiKeyPlaceholder: geminiKeyPlaceholder !== undefined ? geminiKeyPlaceholder : undefined,
        contactEmail: contactEmail !== undefined ? contactEmail.trim() : undefined,
        featureFlags: featureFlags !== undefined ? featureFlags : undefined,
        futureIntegrations: futureIntegrations !== undefined ? futureIntegrations : undefined,
      },
      create: {
        settingsId: "global",
        maintenanceMode: maintenanceMode ?? false,
        homepageAnnouncement: homepageAnnouncement ?? "",
        geminiKeyPlaceholder: geminiKeyPlaceholder ?? "",
        contactEmail: contactEmail ? contactEmail.trim() : "akchauhan1172@gmail.com",
        featureFlags: featureFlags ?? { aiRecommendations: true, scraperEnabled: true, resumeParsing: true },
        futureIntegrations: futureIntegrations ?? {},
      }
    });

    // Log admin action using structured audit logger
    const { logAdminAction } = await import("@/lib/audit-logger");
    await logAdminAction({
      req,
      admin: {
        _id: admin.id,
        fullName: admin.fullName,
        email: admin.email
      },
      action: "Updated Settings",
      resource: "Settings",
      resourceId: "global",
      details: "Updated global platform settings and feature flags",
    });

    const mappedSettings = {
      _id: settings.id,
      settingsId: settings.settingsId,
      maintenanceMode: settings.maintenanceMode,
      homepageAnnouncement: settings.homepageAnnouncement,
      geminiKeyPlaceholder: settings.geminiKeyPlaceholder,
      featureFlags: settings.featureFlags,
      futureIntegrations: settings.futureIntegrations,
      allowedAdminEmails: settings.allowedAdminEmails,
      contactEmail: settings.contactEmail,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: "Platform settings updated successfully",
      data: mappedSettings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
