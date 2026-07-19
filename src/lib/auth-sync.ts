import { currentUser, auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getOrCreateMongoUser() {
  let clerkId: string | null = null;
  try {
    const authData = await auth();
    clerkId = authData?.userId || null;
  } catch (error) {
    console.warn("[Auth Sync] Clerk auth() failed or is not configured. Falling back to dev mode mock user.");
  }

  if (!clerkId) {
    console.log("[Auth Sync] Using fallback mock user (Rahul Sharma)");
    const mockClerkId = "user_123";
    const mockEmail = "rahul@example.com";

    let user = await prisma.user.findUnique({
      where: { clerkId: mockClerkId },
    });

    // Seed (or prior runs) may already have this email under a different clerkId
    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: { equals: mockEmail, mode: "insensitive" } },
      });
      if (user) {
        console.log(
          `[Auth Sync] Linking existing seed/dev user email: ${mockEmail} to mock clerkId: ${mockClerkId}`
        );
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            clerkId: mockClerkId,
            fullName: user.fullName || "Rahul Sharma",
          },
        });
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: "65c3b9b4f123456789abcdef", // Static 24-char hex string to mimic MongoDB ObjectID format
          clerkId: mockClerkId,
          fullName: "Rahul Sharma",
          email: mockEmail,
          profileImage: "",
          role: "jobseeker",
        },
      });
    }

    // Ensure profile exists in Postgres
    let profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) {
      await prisma.profile.create({
        data: {
          user: { connect: { id: user.id } },
          resumeText: "",
          resumeSkillMode: "merge",
          resumeCategory: "",
          resumeSummary: "",
        },
      });
    }

    return {
      ...user,
      _id: user.id,
    };
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
        let profile = await prisma.profile.findUnique({
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
    const generatedId = crypto.randomBytes(12).toString("hex"); // Generate 24-char hex string to mimic MongoDB ObjectID

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
