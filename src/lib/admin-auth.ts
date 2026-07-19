import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

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

  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  });

  if (!user || user.role !== "admin" || !user.email) {
    return null;
  }

  // Load dynamic emails list from database settings
  const globalSettings = await prisma.settings.findUnique({
    where: { settingsId: "global" }
  });
  const dbEmails = (globalSettings?.allowedAdminEmails as string[]) || [];

  const emailLower = user.email.toLowerCase();
  const isHardcoded = ALLOWED_ADMIN_EMAILS.includes(emailLower);
  const isDynamic = dbEmails.map((e: string) => e.toLowerCase()).includes(emailLower);

  if (!isHardcoded && !isDynamic) {
    return null;
  }

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    fullName: user.fullName,
    profileImage: user.profileImage,
    role: user.role,
    status: user.status
  };
}
