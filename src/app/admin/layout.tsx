import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export const metadata: Metadata = {
  title: "Admin Dashboard – JobFusion",
  description: "Internal admin operations dashboard",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  // Redirect if not logged in
  if (!userId) {
    redirect("/");
  }

  // Connect to DB and verify role
  await connectDB();
  const mongoUser = await User.findOne({ clerkId: userId });

  // If user does not exist in DB or is not an admin, deny access
  if (!mongoUser || mongoUser.role !== "admin") {
    redirect("/");
  }

  const clerkUser = await currentUser();
  const adminUser = {
    fullName: mongoUser.fullName || clerkUser?.firstName ? `${clerkUser?.firstName} ${clerkUser?.lastName || ""}`.trim() : "Admin",
    email: mongoUser.email || clerkUser?.emailAddresses[0]?.emailAddress || "",
    profileImage: mongoUser.profileImage || clerkUser?.imageUrl || "",
  };

  return (
    <AdminLayoutClient adminUser={adminUser}>
      {children}
    </AdminLayoutClient>
  );
}
