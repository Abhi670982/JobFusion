import { currentUser, auth } from "@clerk/nextjs/server";
import { connectDB } from "./mongodb";
import User from "@/models/User";
import Profile from "@/models/Profile";

export async function getOrCreateMongoUser() {
  await connectDB();
  
  let clerkId: string | null = null;
  try {
    const authData = await auth();
    clerkId = authData?.userId || null;
  } catch (error) {
    console.warn("[Auth Sync] Clerk auth() failed or is not configured. Falling back to dev mode mock user.");
  }

  if (!clerkId) {
    console.log("[Auth Sync] Using fallback mock user (Rahul Sharma)");
    let user = await User.findOne({ clerkId: "user_123" });
    if (!user) {
      user = await User.create({
        clerkId: "user_123",
        fullName: "Rahul Sharma",
        email: "rahul@example.com",
        profileImage: "",
        role: "jobseeker",
      });
      
      // Check if profile exists
      let profile = await Profile.findOne({ userId: user._id });
      if (!profile) {
        await Profile.create({
          userId: user._id,
          skills: [],
          experiences: [],
          education: [],
          certifications: [],
          projects: [],
          headline: "",
          bio: "",
          location: "",
          experience: "",
          resumeUrl: "",
          resumeName: "",
          resumeText: "",
          phone: "",
          portfolioUrl: "",
          githubUrl: "",
          linkedinUrl: "",
        });
      }
    }
    return user;
  }

  // Try to find user in MongoDB by clerkId
  let user = await User.findOne({ clerkId });

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
        // If fullName is still empty, fall back to email name
    const email = clerkUser.emailAddresses[0]?.emailAddress || "";
    if (!fullName && email) {
      const emailName = email.split("@")[0];
      fullName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }

    if (!fullName) {
      fullName = "User";
    }

    // Check if user already exists by email (casing/ID change handling)
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        // Link the existing user to the new clerkId
        console.log(`[Auth Sync] Linking existing user email: ${email} to new clerkId: ${clerkUser.id}`);
        existingUser.clerkId = clerkUser.id;
        if (fullName && !existingUser.fullName) existingUser.fullName = fullName;
        if (clerkUser.imageUrl) existingUser.profileImage = clerkUser.imageUrl;
        await existingUser.save();
        
        // Ensure profile exists for the user
        let profile = await Profile.findOne({ userId: existingUser._id });
        if (!profile) {
          await Profile.create({
            userId: existingUser._id,
            skills: [],
            experiences: [],
            education: [],
            certifications: [],
            projects: [],
            headline: "",
            bio: "",
            location: "",
            experience: "",
            resumeUrl: "",
            resumeName: "",
            resumeText: "",
            phone: "",
            portfolioUrl: "",
            githubUrl: "",
            linkedinUrl: "",
          });
        }
        return existingUser;
      }
    }

    // Create User document in MongoDB
    user = await User.create({
      clerkId: clerkUser.id,
      fullName,
      email,
      profileImage: clerkUser.imageUrl || "",
      role: "jobseeker",
    });    // Automatically create an empty Profile document linked to the user
    await Profile.create({
      userId: user._id,
      skills: [],
      experiences: [],
      education: [],
      certifications: [],
      projects: [],
      headline: "",
      bio: "",
      location: "",
      experience: "",
      resumeUrl: "",
      resumeName: "",
      resumeText: "",
      phone: "",
      portfolioUrl: "",
      githubUrl: "",
      linkedinUrl: "",
    });

    console.log(`Created new MongoDB User and Profile for Clerk user: ${clerkId}`);
  }

  return user;
}
