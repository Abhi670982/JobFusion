import { NextRequest } from "next/server";
import { prisma } from "./prisma";

interface AuditParams {
  req?: NextRequest;
  admin: {
    _id: any;
    fullName?: string;
    email?: string;
  };
  action: string;
  resource: string;
  resourceId: string;
  details: string;
}

export async function logAdminAction({
  req,
  admin,
  action,
  resource,
  resourceId,
  details,
}: AuditParams) {
  try {
    let ipAddress = "127.0.0.1";
    if (req) {
      ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
      // Clean up proxy list if multiple IPs exist
      if (ipAddress.includes(",")) {
        ipAddress = ipAddress.split(",")[0].trim();
      }
    }

    // Write to PostgreSQL
    try {
      await prisma.activity.create({
        data: {
          userId: admin._id ? admin._id.toString() : null,
          type: "admin_action",
          details,
          adminName: admin.fullName || "Admin",
          adminEmail: admin.email || "",
          action,
          resource,
          resourceId,
          ipAddress,
        }
      });
    } catch (pgErr) {
      console.error("[Audit Logger Postgres] Failed to log admin action:", pgErr);
    }
  } catch (err) {
    console.error("[Audit Logger] Failed to record admin action:", err);
  }
}
