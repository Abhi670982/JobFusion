import { auth } from "@clerk/nextjs/server";
import { connectDB } from "./mongodb";
import User from "@/models/User";

const ALLOWED_ADMIN_EMAILS = [
  "akchauhan1172@gmail.com",
  "abhishekchauhan1172@gmail.com",
  "thomasramesh449@gmail.com",
  "sudhanshukr388@gmail.com",
  "piyushkumar.prog@gmail.com",
  "abhi@gmail.com",
];

export async function verifyAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  await connectDB();
  const user = await User.findOne({ clerkId: userId });
  if (!user || user.role !== "admin" || !user.email) {
    return null;
  }

  // Load dynamic emails list from database settings
  const Settings = (await import("@/models/Settings")).default;
  const globalSettings = await Settings.findOne({ settingsId: "global" });
  const dbEmails = (globalSettings?.allowedAdminEmails || []) as string[];

  const emailLower = user.email.toLowerCase();
  const isHardcoded = ALLOWED_ADMIN_EMAILS.includes(emailLower);
  const isDynamic = dbEmails.map((e: string) => e.toLowerCase()).includes(emailLower);

  if (!isHardcoded && !isDynamic) {
    return null;
  }

  return user;
}
