import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { safeErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
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
          featureFlags: { resumeParsing: true, scraperEnabled: true, aiRecommendations: true },
          futureIntegrations: {},
          allowedAdminEmails: [
            "akchauhan1172@gmail.com",
            "abhishekchauhan1172@gmail.com",
            "thomasramesh449@gmail.com",
            "sudhanshukr388@gmail.com",
            "piyushkumar.prog@gmail.com"
          ],
          contactEmail: "akchauhan1172@gmail.com",
        }
      });
    }

    const mappedSettings = {
      _id: settings.id,
      maintenanceMode: settings.maintenanceMode,
      homepageAnnouncement: settings.homepageAnnouncement,
      geminiKeyPlaceholder: settings.geminiKeyPlaceholder,
      featureFlags: settings.featureFlags,
      futureIntegrations: settings.futureIntegrations,
      allowedAdminEmails: settings.allowedAdminEmails,
      contactEmail: settings.contactEmail,
      lastCrawlAt: settings.lastCrawlAt,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: mappedSettings,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to load settings");
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();

    const updateData: any = {};
    if (body.maintenanceMode !== undefined) updateData.maintenanceMode = body.maintenanceMode;
    if (body.homepageAnnouncement !== undefined) updateData.homepageAnnouncement = body.homepageAnnouncement;
    if (body.geminiKeyPlaceholder !== undefined) updateData.geminiKeyPlaceholder = body.geminiKeyPlaceholder;
    if (body.featureFlags !== undefined) updateData.featureFlags = body.featureFlags;
    if (body.futureIntegrations !== undefined) updateData.futureIntegrations = body.futureIntegrations;
    if (body.allowedAdminEmails !== undefined) updateData.allowedAdminEmails = body.allowedAdminEmails;
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail;

    const settings = await prisma.settings.upsert({
      where: { settingsId: "global" },
      update: updateData,
      create: {
        settingsId: "global",
        maintenanceMode: body.maintenanceMode || false,
        homepageAnnouncement: body.homepageAnnouncement || "",
        geminiKeyPlaceholder: body.geminiKeyPlaceholder || "",
        featureFlags: body.featureFlags || { resumeParsing: true, scraperEnabled: true, aiRecommendations: true },
        futureIntegrations: body.futureIntegrations || {},
        allowedAdminEmails: body.allowedAdminEmails || [],
        contactEmail: body.contactEmail || "akchauhan1172@gmail.com",
      }
    });

    const mappedSettings = {
      _id: settings.id,
      maintenanceMode: settings.maintenanceMode,
      homepageAnnouncement: settings.homepageAnnouncement,
      geminiKeyPlaceholder: settings.geminiKeyPlaceholder,
      featureFlags: settings.featureFlags,
      futureIntegrations: settings.futureIntegrations,
      allowedAdminEmails: settings.allowedAdminEmails,
      contactEmail: settings.contactEmail,
      lastCrawlAt: settings.lastCrawlAt,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: "Platform settings updated successfully",
      data: mappedSettings,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to save settings");
  }
}
