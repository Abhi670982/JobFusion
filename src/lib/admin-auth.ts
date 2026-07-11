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
  if (!user || user.role !== "admin" || !user.email || !ALLOWED_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return null;
  }

  return user;
}
