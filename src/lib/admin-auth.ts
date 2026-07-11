import { auth } from "@clerk/nextjs/server";
import { connectDB } from "./mongodb";
import User from "@/models/User";

export async function verifyAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  await connectDB();
  const user = await User.findOne({ clerkId: userId });
  if (!user || user.role !== "admin") {
    return null;
  }

  return user;
}
