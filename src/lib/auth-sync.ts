import { currentUser, auth } from "@clerk/nextjs/server";
import { connectDB } from "./mongodb";
import User from "@/models/User";
import Profile from "@/models/Profile";

export async function getOrCreateMongoUser() {
  await connectDB();
  
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return null;
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

    // Create User document in MongoDB
    user = await User.create({
      clerkId: clerkUser.id,
      fullName,
      email,
      profileImage: clerkUser.imageUrl || "",
      role: "jobseeker",
    });

    // Automatically create an empty Profile document linked to the user
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
