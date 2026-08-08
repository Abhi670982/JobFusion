import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser, safeErrorResponse } from "@/lib/security";
import { clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/user/delete-account
 * Secure Permanent Account Deletion Workflow:
 * 1. Authenticate session server-side via Clerk.
 * 2. Delete all user-owned database records (Profile, Resumes, Analyses, Saved Jobs, Applications, Usages, Activities, Crawl State, Reports).
 * 3. Delete Clerk user account using Clerk Server SDK.
 */
export async function DELETE() {
  try {
    const { user, errorResponse } = await requireAuthUser();
    if (errorResponse) return errorResponse;

    const userId = user.id;
    const clerkUserId = user.clerkId;

    console.log(`[Account Deletion] Initiating permanent account deletion for user: ${userId} (Clerk: ${clerkUserId})`);

    // Perform database deletion in a transaction for data integrity
    await prisma.$transaction([
      prisma.savedJob.deleteMany({ where: { userId } }),
      prisma.application.deleteMany({ where: { userId } }),
      prisma.activity.deleteMany({ where: { userId } }),
      prisma.userUsage.deleteMany({ where: { userId } }),
      prisma.userJob.deleteMany({ where: { userId } }),
      prisma.userCrawlState.deleteMany({ where: { userId } }),
      prisma.resumeParsingLog.deleteMany({ where: { userId } }),
      prisma.report.deleteMany({ where: { userId } }),
      prisma.profile.deleteMany({ where: { userId } }),
      prisma.subscription.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    console.log(`[Account Deletion] Database records successfully erased for user: ${userId}`);

    // Delete identity record in Clerk
    if (clerkUserId) {
      try {
        const client = await clerkClient();
        await client.users.deleteUser(clerkUserId);
        console.log(`[Account Deletion] Clerk user successfully deleted: ${clerkUserId}`);
      } catch (clerkErr: any) {
        console.error("[Account Deletion] Warning: Clerk user deletion failed or user already removed:", clerkErr?.message || clerkErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Your account and all associated data have been permanently deleted.",
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, "Failed to delete account permanently");
  }
}
