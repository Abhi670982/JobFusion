import { currentUser, auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getOrCreateMongoUser() {
  let clerkId: string | null = null;
  try {
    const authData = await auth();
    clerkId = authData?.userId || null;
  } catch {
    console.warn("[Auth Sync] Clerk auth() failed or is not configured.");
  }

  // Strictly enforce authentication: No mock/guest/seed fallback user
  if (!clerkId) {
    return null;
  }

  // Find user in PostgreSQL by clerkId
  let user = await prisma.user.findUnique({
    where: { clerkId }
  });

  if (!user) {
    // Fetch Clerk user details
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return null;
    }

    // Determine the name
    let fullName = "";
    if (clerkUser.firstName || clerkUser.lastName) {
      fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
    }
    const email = clerkUser.emailAddresses[0]?.emailAddress || "";
    if (!fullName && email) {
      const emailName = email.split("@")[0];
      fullName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }

    if (!fullName) {
      fullName = "User";
    }

    // Check if user already exists by email (handle email/ID links)
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } }
      });
      if (existingUser) {
        console.log(`[Auth Sync] Linking existing user email: ${email} to new clerkId: ${clerkUser.id}`);
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            clerkId: clerkUser.id,
            fullName: existingUser.fullName || fullName,
            profileImage: existingUser.profileImage || clerkUser.imageUrl || ""
          }
        });
        
        // Ensure profile exists for the user
        const profile = await prisma.profile.findUnique({
          where: { userId: user.id }
        });
        if (!profile) {
          await prisma.profile.create({
            data: {
              user: { connect: { id: user.id } },
              resumeText: "",
              resumeSkillMode: "merge",
              resumeCategory: "",
              resumeSummary: "",
            }
          });
        }

        return {
          ...user,
          _id: user.id
        };
      }
    }

    // Create User in PostgreSQL
    const crypto = await import("crypto");
    const generatedId = crypto.randomBytes(12).toString("hex"); // Generate 24-char hex string

    user = await prisma.user.create({
      data: {
        id: generatedId,
        clerkId: clerkUser.id,
        fullName,
        email,
        profileImage: clerkUser.imageUrl || "",
        role: "jobseeker",
      }
    });

    // Create Profile in PostgreSQL linked to the user
    await prisma.profile.create({
      data: {
        user: { connect: { id: user.id } },
        resumeText: "",
        resumeSkillMode: "merge",
        resumeCategory: "",
        resumeSummary: "",
      }
    });

    console.log(`Created new PostgreSQL User and Profile for Clerk user: ${clerkId}`);
  }

  return {
    ...user,
    _id: user.id
  };
}
