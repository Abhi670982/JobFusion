import { currentUser, auth } from "@clerk/nextjs/server";
import { connectDB } from "./mongodb";
import User from "@/models/User";
import Profile from "@/models/Profile";

export async function getOrCreateMongoUser() {
  console.log("[AUTH-SYNC] getOrCreateMongoUser() started");
  await connectDB();
  
  let clerkId: string | null = null;
  try {
    const authObject = await auth();
    clerkId = authObject?.userId;
    console.log(`[AUTH-SYNC] Clerk auth check: userId = ${clerkId}`);
  } catch (authErr: any) {
    console.error("[AUTH-SYNC] Error fetching Clerk auth details:", authErr);
    return null;
  }

  if (!clerkId) {
    console.log("[AUTH-SYNC] No Clerk user ID found in session. User is anonymous.");
    return null;
  }

  // Try to find user in MongoDB by clerkId
  console.log(`[AUTH-SYNC] Querying MongoDB User model for clerkId: ${clerkId}`);
  let user = await User.findOne({ clerkId });

  if (!user) {
    console.log(`[AUTH-SYNC] User not found in MongoDB. Querying Clerk API for details...`);
    // Fetch Clerk user details
    const clerkUser = await currentUser();
    if (!clerkUser) {
      console.warn(`[AUTH-SYNC] Clerk currentUser() returned null for clerkId: ${clerkId}`);
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

    console.log(`[AUTH-SYNC] Creating new user in MongoDB: name='${fullName}', email='${email}'`);
    // Create User document in MongoDB
    user = await User.create({
      clerkId: clerkUser.id,
      fullName,
      email,
      profileImage: clerkUser.imageUrl || "",
      role: "jobseeker",
    });
    console.log(`[AUTH-SYNC] Successfully created MongoDB User document (ID: ${user._id})`);
  } else {
    console.log(`[AUTH-SYNC] Found existing MongoDB User document (ID: ${user._id})`);
  }

  // Defensive check: Ensure a Profile exists for this User
  const profile = await Profile.findOne({ userId: user._id });
  if (!profile) {
    console.log(`[AUTH-SYNC] WARNING: Profile document missing for user ${user._id}. Creating empty profile now...`);
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
    console.log(`[AUTH-SYNC] Successfully created missing Profile document for user ${user._id}`);
  } else {
    console.log(`[AUTH-SYNC] Profile document validated for user ${user._id}`);
  }

  return user;
}
